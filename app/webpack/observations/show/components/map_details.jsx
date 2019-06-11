import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
/* global iNatModels */

class MapDetails extends React.Component {
  static placeList( places ) {
    return places.map( p => {
      let placeType;
      if ( p && p.place_type && iNatModels.Place.PLACE_TYPES[p.place_type] ) {
        placeType = I18n.t( `place_geo.geo_planet_place_types.${
          _.snakeCase( iNatModels.Place.PLACE_TYPES[p.place_type] )}` );
      }
      const label = placeType && (
        <span className="type">
          { _.upperFirst( placeType ) }
        </span>
      );
      return (
        <span className="place" key={`place-${p.id}`}>
          <a href={`/observations?place_id=${p.id}`}>
            { p.display_name }
          </a>
          { label }
        </span>
      );
    } );
  }

  constructor( ) {
    super( );
    this.state = {
      showAllPlaces: false
    };
  }

  render( ) {
    const {
      observation,
      observationPlaces,
      config,
      disableAutoObscuration,
      restoreAutoObscuration
    } = this.props;
    if ( !observation || !observation.user ) { return ( <div /> ); }
    const viewerIsAdmin = config && config.currentUser && config.currentUser.roles
      && config.currentUser.roles.indexOf( "admin" ) >= 0;
    const { showAllPlaces } = this.state;
    const { currentUser } = config;
    const testingContextGeoprivacy = currentUser
      && currentUser.prefers_coordinate_interpolation_protection_test;
    let accuracy = observation.private_geojson
      ? observation.positional_accuracy : observation.public_positional_accuracy;
    let accuracyUnits = "m";
    if ( accuracy > 1000 ) {
      accuracy = _.round( accuracy / 1000, 2 );
      accuracyUnits = "km";
    }
    let geoprivacy = I18n.t( "open_" );
    if ( observation.geoprivacy === "private" ) {
      geoprivacy = I18n.t( "private_" );
    } else if ( observation.geoprivacy === "obscured" ) {
      geoprivacy = I18n.t( "obscured" );
    } else if ( observation.geoprivacy ) {
      geoprivacy = I18n.t( observation.geoprivacy );
    } else if ( !testingContextGeoprivacy && observation.context_geoprivacy === "obscured" ) {
      geoprivacy = I18n.t( "obscured" );
    }
    let currentUserHasProjectCuratorCoordinateAccess;
    if ( currentUser && currentUser.id ) {
      currentUserHasProjectCuratorCoordinateAccess = _.find(
        observation.project_observations,
        po => (
          po.preferences
          && po.preferences.allows_curator_coordinate_access
          && po.project.admins.map( a => a.user_id ).indexOf( currentUser.id ) >= 0
        )
      );
    }
    const currentUserHasCoordinateAccessPrivilege = currentUser
      && currentUser.userPrivileges
      && currentUser.userPrivileges.indexOf( "coordinate_access" )
      && viewerIsAdmin;
    const projectObservationsWithCoordinateAccess = _.filter(
      observation.project_observations,
      po => po.preferences && po.preferences.allows_curator_coordinate_access
    );
    const adminPlaces = observationPlaces.filter( op => ( op.admin_level !== null ) );
    const communityPlaces = observationPlaces.filter( op => ( op.admin_level === null ) );
    const defaultNumberOfCommunityPlaces = 10;
    const obscurationExplanationGeoprivacy = (
      <li>
        <strong>
          <i className="icon-icn-location-obscured" />
          { I18n.t( "label_colon", { label: I18n.t( "geoprivacy_is_obscured" ) } ) }
        </strong>
        { " " }
        { I18n.t( "geoprivacy_is_obscured_desc" ) }
      </li>
    );
    let sameDayLinks;
    if ( currentUser && currentUser.id === observation.user.id ) {
      let obscuredObsURL = `/observations?user_id=${observation.user.login}&on=${observation.observed_on}&taxon_geoprivacy=obscured,private`;
      if ( currentUser.prefers_coordinate_interpolation_protection ) {
        obscuredObsURL += "&geoprivacy=obscured,private";
      }
      sameDayLinks = (
        <ul>
          <li>
            <a
              href={obscuredObsURL}
              target="_blank"
              rel="noopener noreferrer"
            >
              { I18n.t( "view_observations_causing_this_observation_to_be_obscured" ) }
            </a>
          </li>
        </ul>
      );
    }
    return (
      <div className="MapDetails">
        <div className="top_info">
          <div className="info">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "lat" ) } ) }</span>
            { " " }
            <span className="value">{ _.round( observation.latitude, 6 ) }</span>
          </div>
          <div className="info">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "long" ) } ) }</span>
            { " " }
            <span className="value">{ _.round( observation.longitude, 6 ) }</span>
          </div>
          <div className="info">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "accuracy" ) } ) }</span>
            { " " }
            <span className="value">
              { accuracy ? `${accuracy}${accuracyUnits}` : I18n.t( "not_recorded" ) }
            </span>
          </div>
          <div className="info">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "geoprivacy" ) } ) }</span>
            { " " }
            <span className="value">{ geoprivacy }</span>
          </div>
        </div>
        <div className="places clearfix">
          <h4>{ I18n.t( "encompassing_places" ) }</h4>
          <div className="standard">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "standard" ) } ) }</span>
            { MapDetails.placeList( adminPlaces ) }
          </div>
          <div className="community">
            <span className="attr">{ I18n.t( "label_colon", { label: I18n.t( "community_curated" ) } ) }</span>
            { communityPlaces.lenght < defaultNumberOfCommunityPlaces ? (
              MapDetails.placeList( communityPlaces )
            ) : (
              <div>
                { MapDetails.placeList( communityPlaces.slice(
                  0,
                  showAllPlaces ? communityPlaces.length : defaultNumberOfCommunityPlaces
                ) ) }
                { communityPlaces.length > defaultNumberOfCommunityPlaces && (
                  showAllPlaces ? (
                    <button className="btn btn-link btn-more" type="button" onClick={( ) => this.setState( { showAllPlaces: false } )}>
                      { I18n.t( "less" ) }
                    </button>
                  ) : (
                    <button className="btn btn-link btn-more" type="button" onClick={( ) => this.setState( { showAllPlaces: true } )}>
                      { I18n.t( "more" ) }
                    </button>
                  )
                ) }
              </div>
            ) }
          </div>
        </div>
        { observation.obscured && ( observation.geoprivacy || observation.taxon_geoprivacy || observation.context_geoprivacy ) && (
          <div className="obscured">
            <h4>{ I18n.t( "why_the_coordinates_are_obscured" ) }</h4>
            <ul className="plain">
              { observation.geoprivacy === "obscured" && obscurationExplanationGeoprivacy }
              { observation.geoprivacy === "private" && (
                <li>
                  <strong>
                    <i className="icon-icn-location-private" />
                    { I18n.t( "label_colon", { label: I18n.t( "geoprivacy_is_private" ) } ) }
                  </strong>
                  { " " }
                  { I18n.t( "geoprivacy_is_private_desc" ) }
                </li>
              ) }
              { observation.taxon_geoprivacy === "obscured" && (
                <li>
                  <strong>
                    <i className="fa fa-flag" />
                    { I18n.t( "label_colon", { label: I18n.t( "taxon_is_threatened_coordinates_obscured" ) } ) }
                  </strong>
                  { " " }
                  { I18n.t( "taxon_is_threatened_coordinates_obscured_desc" ) }
                </li>
              ) }
              { observation.taxon_geoprivacy === "private" && (
                <li>
                  <strong>
                    <i className="fa fa-flag" />
                    { I18n.t( "label_colon", { label: I18n.t( "taxon_is_threatened_coordinates_hidden" ) } ) }
                  </strong>
                  { " " }
                  { I18n.t( "taxon_is_threatened_coordinates_hidden_desc" ) }
                </li>
              ) }
              {
                observation.context_geoprivacy === "obscured" && (
                  testingContextGeoprivacy ? (
                    <li>
                      <p>
                        <strong>
                          <i className="fa fa-calendar" />
                          { I18n.t( "label_colon", { label: I18n.t( "same_day_obscured" ) } ) }
                        </strong>
                        { " " }
                        { I18n.t( "same_day_obscured_desc" ) }
                      </p>
                      { sameDayLinks }
                    </li>
                  ) : (
                    obscurationExplanationGeoprivacy
                  )
                )
              }
              { testingContextGeoprivacy && observation.context_geoprivacy === "private" && (
                <li>
                  <strong>
                    <i className="fa fa-calendar" />
                    { I18n.t( "label_colon", { label: I18n.t( "same_day_private" ) } ) }
                  </strong>
                  { " " }
                  { I18n.t( "same_day_private_desc" ) }
                  { sameDayLinks }
                </li>
              ) }
            </ul>
            <h4>{ I18n.t( "who_can_see_the_coordinates" ) }</h4>
            <ul className="plain">
              <li>
                <i className="icon-person" />
                { I18n.t( "who_can_see_the_coordinates_observer" ) }
              </li>
              <li>
                <i className="icon-people" />
                { I18n.t( "who_can_see_the_coordinates_trusted" ) }
              </li>
              { viewerIsAdmin && ( observation.geoprivacy === null || observation.geoprivacy === "open" ) && (
                <li>
                  <i className="fa fa-certificate" />
                  { I18n.t( "who_can_see_the_coordinates_privileged" ) }
                </li>
              ) }
              { projectObservationsWithCoordinateAccess
                && projectObservationsWithCoordinateAccess.length > 0 && (
                <li>
                  <i className="fa fa-briefcase" />
                  { I18n.t( "label_colon", { label: I18n.t( "who_can_see_the_coordinates_projects" ) } ) }
                  <ul>
                    { projectObservationsWithCoordinateAccess.map( po => (
                      <li key={`map-details-projects-${po.id}`}>
                        <a href={`/projects/${po.project.slug}`}>
                          { po.project.title }
                        </a>
                      </li>
                    ) ) }
                  </ul>
                </li>
              ) }
            </ul>
            { observation.private_geojson && (
              <div>
                <h4>{ I18n.t( "why_you_can_see_the_coordinates" ) }</h4>
                <ul className="plain">
                  { currentUser && currentUser.id === observation.user.id && (
                    <li>
                      <strong>
                        <i className="icon-person" />
                        { I18n.t( "label_colon", { label: I18n.t( "this_is_your_observation" ) } ) }
                      </strong>
                      { " " }
                      { I18n.t( "this_is_your_observation_desc" ) }
                    </li>
                  ) }
                  { currentUserHasProjectCuratorCoordinateAccess && (
                    <li>
                      <strong>
                        <i className="fa fa-briefcase" />
                        { I18n.t( "label_colon", { label: I18n.t( "you_curate_a_project_that_contains_this_observation" ) } ) }
                      </strong>
                      { " " }
                      { I18n.t( "you_curate_a_project_that_contains_this_observation_desc" ) }
                    </li>
                  ) }
                  { observation.viewer_trusted_by_observer && (
                    <li>
                      <strong>
                        <i className="icon-person" />
                        { I18n.t( "label_colon", {
                          label: I18n.t( "user_trusts_you_with_their_private_coordinates", { user: observation.user.login } )
                        } ) }
                      </strong>
                      { " " }
                      { I18n.t( "user_trusts_you_with_their_private_coordinates_desc" ) }
                    </li>
                  ) }
                  { currentUserHasCoordinateAccessPrivilege && (
                    <li>
                      <strong>
                        <i className="fa fa-certificate" />
                        { I18n.t( "label_colon", {
                          label: I18n.t( "youve_earned_the_coordinate_access_privilege" )
                        } ) }
                      </strong>
                      { " " }
                      { I18n.t( "youve_earned_the_coordinate_access_privilege_desc" ) }
                    </li>
                  ) }
                </ul>
              </div>
            ) }
          </div>
        ) }
        { viewerIsAdmin && currentUser && currentUser.id === observation.user.id && (
          ( observation.taxon_geoprivacy === "open" || _.isEmpty( observation.taxon_geoprivacy ) )
          && ["obscured", "private"].indexOf( observation.context_geoprivacy ) >= 0
        ) && (
          <div className="auto-obscuration-preference admin">
            { observation.preferences.auto_obscuration === false ? (
              <button
                type="button"
                className="btn btn-default btn-xs"
                onClick={( ) => restoreAutoObscuration( )}
              >
                Restore Auto-obscuration
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-default btn-xs"
                onClick={( ) => disableAutoObscuration( )}
              >
                Disable Auto-obscuration
              </button>
            ) }
            <p>
              For now this will only let you disable auto-obscuration for same-day obscuration.
            </p>
          </div>
        ) }
        <div className="links">
          <span className="attr">{ I18n.t( "view_on" ) }</span>
          <span>
            <span className="info">
              <a
                className="value"
                href={`https://www.google.com/maps?q=loc:${observation.latitude},${observation.longitude}`}
              >
                { I18n.t( "google" ) }
              </a>
            </span>
            <span className="info">
              <a
                className="value"
                href={`https://www.openstreetmap.org/?mlat=${observation.latitude}&mlon=${observation.longitude}`}
              >
                { I18n.t( "open_street_map" ) }
              </a>
            </span>
            {/*
              Nice to have, but sort of useless unless macrostrat implements the abililty to link to the infowindow
              and not just the coords
              <span className="info">
                <a className="value" href={ `https://macrostrat.org/map/#5/${observation.latitude}/${observation.longitude}` }>
                  { I18n.t( "macrostrat" ) }
                </a>
              </span>
            */}
          </span>
        </div>
      </div>
    );
  }
}

MapDetails.propTypes = {
  observation: PropTypes.object,
  observationPlaces: PropTypes.array,
  config: PropTypes.object,
  disableAutoObscuration: PropTypes.func,
  restoreAutoObscuration: PropTypes.func
};

MapDetails.defaultProps = {
  config: {},
  observationPlaces: []
};

export default MapDetails;
