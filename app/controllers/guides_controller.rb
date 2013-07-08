class GuidesController < ApplicationController
  before_filter :authenticate_user!, :except => [:index, :show]
  before_filter :load_record, :only => [:show, :edit, :update, :destroy, :import_taxa]
  before_filter :require_owner, :only => [:edit, :update, :destroy, :import_taxa]
  layout "bootstrap"
  PDF_LAYOUTS = %w(grid book)
  
  # GET /guides
  # GET /guides.json
  def index
    @guides = Guide.page(params[:page])
    respond_to do |format|
      format.html
      format.json { render json: {:guides => @guides.as_json} }
    end
  end

  # GET /guides/1
  # GET /guides/1.json
  def show
    unless params[:taxon].blank?
      @taxon = Taxon::ICONIC_TAXA_BY_ID[params[:taxon]]
      @taxon ||= Taxon::ICONIC_TAXA_BY_NAME[params[:taxon]]
      @taxon ||= Taxon.find_by_name(params[:taxon]) || Taxon.find_by_id(params[:taxon])
    end
    @q = params[:q]
    
    @guide_taxa = @guide.guide_taxa.order("guide_taxa.position").
      includes({:taxon => [:taxon_ranges_without_geom]}, :guide_photos, :guide_sections).
      page(params[:page]).per_page(100)
    @guide_taxa = @guide_taxa.in_taxon(@taxon) if @taxon
    @guide_taxa = @guide_taxa.dbsearch(@q) unless @q.blank?
    @view = params[:view] || "grid"

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @guide.as_json(:root => true) }
      format.pdf do
        @guide_taxa = @guide.guide_taxa.order("guide_taxa.position").
          includes({:taxon => [:taxon_ranges_without_geom]}, :guide_photos, :guide_sections)
        @layout = params[:layout] if PDF_LAYOUTS.include?(params[:layout])
        @layout ||= "grid"
        @template = "guides/show_#{@layout}.pdf.haml"
        render :pdf => "#{@guide.title.parameterize}.#{@layout}", 
          :layout => "bootstrap.pdf",
          :template => @template,
          :show_as_html => params[:debug].present? && logged_in?,
          :disposition => "attachment",
          :margin => {
            :left => 0,
            :right => 0
          }
      end
    end
  end

  # GET /guides/new
  # GET /guides/new.json
  def new
    @guide = Guide.new
    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @guide.as_json(:root => true) }
    end
  end

  # GET /guides/1/edit
  def edit
    @nav_options = %w(iconic tag)
    @guide_taxa = @guide.guide_taxa.includes(:taxon => [:taxon_photos => [:photo]], :guide_photos => [:photo]).order("guide_taxa.position")
  end

  # POST /guides
  # POST /guides.json
  def create
    @guide = Guide.new(params[:guide])
    @guide.user = current_user

    respond_to do |format|
      if @guide.save
        create_default_guide_taxa
        format.html { redirect_to edit_guide_path(@guide), notice: 'Guide was successfully created.' }
        format.json { render json: @guide.as_json(:root => true), status: :created, location: @guide }
      else
        format.html { render action: "new" }
        format.json { render json: @guide.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /guides/1
  # PUT /guides/1.json
  def update
    create_default_guide_taxa
    respond_to do |format|
      if @guide.update_attributes(params[:guide])
        format.html { redirect_to @guide, notice: 'Guide was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @guide.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /guides/1
  # DELETE /guides/1.json
  def destroy
    @guide.destroy

    respond_to do |format|
      format.html { redirect_to guides_url, notice: 'Guide deleted.' }
      format.json { head :no_content }
    end
  end

  def import_taxa
    @guide_taxa = @guide.import_taxa(params)
    respond_to do |format|
      format.json do
        if partial = params[:partial]
          @guide_taxa.each_with_index do |gt, i|
            next if gt.new_record?
            @guide_taxa[i].html = view_context.render_in_format(:html, partial, :guide_taxon => gt)
          end
        end
        render :json => {:guide_taxa => @guide_taxa.as_json(:root => false, :methods => [:errors, :html, :valid?])}
      end
    end
  end

  private

  def create_default_guide_taxa
    @guide.import_taxa(params)
  end
end
