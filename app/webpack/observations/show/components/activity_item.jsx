import React from "react";
import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import _ from "lodash";
import {
  OverlayTrigger,
  Panel,
  Tooltip,
  Popover
} from "react-bootstrap";
import moment from "moment-timezone";
import SplitTaxon from "../../../shared/components/split_taxon";
import UserText from "../../../shared/components/user_text";
import UserImage from "../../../shared/components/user_image";
import ActivityItemMenu from "./activity_item_menu";
import util from "../util";
import { urlForTaxon } from "../../../taxa/shared/util";

const ActivityItem = ( {
  observation,
  item,
  config,
  deleteComment,
  deleteID,
  restoreID,
  setFlaggingModalState,
  currentUserID,
  addID,
  linkTarget,
  hideCompare,
  hideDisagreement,
  hideCategory,
  noTaxonLink,
  onClickCompare,
  trustUser,
  untrustUser
} ) => {
  if ( !item ) { return ( <div /> ); }
  const { taxon } = item;
  const isID = !!taxon;
  const loggedIn = config && config.currentUser;
  let contents;
  let header;
  let className;
  const testingDisagreementTypes = config && config.currentUser
    && config.currentUser.roles
    && config.currentUser.roles.indexOf( "admin" ) >= 0;
  const userLink = (
    <a
      className="user"
      href={`/people/${item.user.login}`}
      target={linkTarget}
    >
      { item.user.login }
    </a>
  );
  if ( isID ) {
    const buttons = [];
    let canAgree = false;
    let userAgreedToThis;
    if ( loggedIn && item.current && item.firstDisplay && item.user.id !== config.currentUser.id ) {
      if ( currentUserID ) {
        canAgree = currentUserID.taxon.id !== taxon.id;
        userAgreedToThis = currentUserID.agreedTo && currentUserID.agreedTo.id === item.id;
      } else {
        canAgree = true;
      }
    }
    if ( loggedIn && item.firstDisplay && !hideCompare ) {
      let compareTaxonID = taxon.id;
      if ( taxon.rank_level <= 10 ) {
        compareTaxonID = taxon.ancestor_ids[taxon.ancestor_ids.length - 1];
      }
      buttons.push( (
        <a
          key={`id-compare-${item.id}`}
          href={`/observations/identotron?observation_id=${observation.id}&taxon=${compareTaxonID}`}
        >
          <button
            type="button"
            className="btn btn-default btn-sm"
            onClick={e => {
              if ( onClickCompare ) {
                return onClickCompare( e, taxon, observation, { currentUser: config.currentUser } );
              }
              return true;
            }}
          >
            <i className="fa fa-exchange" />
            { " " }
            { I18n.t( "compare" ) }
          </button>
        </a>
      ) );
    }
    if ( loggedIn && ( canAgree || userAgreedToThis ) ) {
      buttons.push( (
        <button
          type="button"
          key={`id-agree-${item.id}`}
          className="btn btn-default btn-sm"
          onClick={( ) => { addID( taxon, { agreedTo: item } ); }}
          disabled={userAgreedToThis}
        >
          { userAgreedToThis ? ( <div className="loading_spinner" /> )
            : ( <i className="fa fa-check" /> ) }
          { " " }
          { I18n.t( "agree_" ) }
        </button>
      ) );
    }
    const buttonDiv = (
      <div className="buttons">
        <div className="btn-space">
          { buttons }
        </div>
      </div>
    );
    const taxonImageTag = util.taxonImage( taxon );
    header = I18n.t( "user_suggested_an_id", { user: ReactDOMServer.renderToString( userLink ) } );
    if ( item.disagreement ) {
      header += "*";
    }
    if ( !item.current ) { className = "withdrawn"; }
    contents = (
      <div className="identification">
        { buttonDiv }
        <div className="taxon">
          { noTaxonLink ? taxonImageTag : (
            <a href={`/taxa/${taxon.id}`} target={linkTarget}>
              { taxonImageTag }
            </a>
          ) }
          <SplitTaxon
            taxon={taxon}
            url={noTaxonLink ? null : `/taxa/${taxon.id}`}
            noParens
            target={linkTarget}
            user={config.currentUser}
            showMemberGroup
          />
        </div>
        { item.body && ( <UserText text={item.body} className="id_body" /> ) }
      </div>
    );
  } else {
    header = I18n.t( "user_commented", { user: ReactDOMServer.renderToString( userLink ) } );
    contents = ( <UserText text={item.body} /> );
  }
  const relativeTime = moment.parseZone( item.created_at ).fromNow( );
  let panelClass;
  const headerItems = [];
  const unresolvedFlags = _.filter( item.flags || [], f => !f.resolved );
  if ( unresolvedFlags.length > 0 ) {
    panelClass = "flagged";
    headerItems.push(
      <span key={`flagged-${item.id}`} className="item-status">
        <a
          href={`/${isID ? "identifications" : "comments"}/${item.id}/flags`}
          rel="nofollow noopener noreferrer"
          target="_blank"
        >
          <i className="fa fa-flag" />
          { " " }
          { I18n.t( "flagged_" ) }
        </a>
      </span>
    );
  } else if ( item.category && item.current && !hideCategory ) {
    let idCategory;
    let idCategoryTooltipText;
    if ( item.category === "maverick" ) {
      panelClass = "maverick";
      idCategory = (
        <span key={`maverick-${item.id}`} className="item-status ident-category">
          <i className="fa fa-bolt" />
          { " " }
          { I18n.t( "maverick" ) }
        </span>
      );
      idCategoryTooltipText = I18n.t( "id_categories.tooltips.maverick" );
    } else if ( item.category === "improving" ) {
      panelClass = "improving";
      idCategory = (
        <span key={`improving-${item.id}`} className="item-status ident-category">
          <i className="fa fa-trophy" />
          { " " }
          { I18n.t( "improving" ) }
        </span>
      );
      idCategoryTooltipText = I18n.t( "id_categories.tooltips.improving" );
    } else if ( item.category === "leading" ) {
      panelClass = "leading";
      idCategory = (
        <span key={`leading-${item.id}`} className="item-status ident-category">
          <i className="icon-icn-leading-id" />
          { " " }
          { I18n.t( "leading" ) }
        </span>
      );
      idCategoryTooltipText = I18n.t( "id_categories.tooltips.leading" );
    }
    if ( idCategory ) {
      headerItems.push(
        <OverlayTrigger
          key={`ident-category-tooltip-${item.id}`}
          container={$( "#wrapper.bootstrap" ).get( 0 )}
          placement="top"
          delayShow={200}
          overlay={(
            <Tooltip id={`tooltip-${item.id}`}>
              { idCategoryTooltipText }
            </Tooltip>
          )}
        >
          { idCategory }
        </OverlayTrigger>
      );
    }
  }
  if ( item.vision ) {
    headerItems.push(
      <OverlayTrigger
        key={`itent-vision-${item.id}`}
        container={$( "#wrapper.bootstrap" ).get( 0 )}
        trigger="click"
        rootClose
        placement="top"
        delayShow={200}
        overlay={(
          <Popover
            id={`vision-popover-${item.id}`}
            title={I18n.t( "computer_vision_suggestion" )}
          >
            { I18n.t( "computer_vision_suggestion_desc" ) }
          </Popover>
        )}
      >
        <span className="vision-status">
          <i className="icon-sparkly-label" />
        </span>
      </OverlayTrigger>
    );
  }
  if ( item.taxon && !item.current ) {
    headerItems.push(
      <span key={`ident-withdrawn-${item.id}`} className="item-status">
        <i className="fa fa-ban" />
        { " " }
        { I18n.t( "id_withdrawn" ) }
      </span>
    );
  }
  let taxonChange;
  if ( item.taxon_change ) {
    const type = _.snakeCase( item.taxon_change.type );
    taxonChange = (
      <div className="taxon-change">
        <i className="fa fa-refresh" />
        { " " }
        { I18n.t( "this_id_was_added_due_to_a" ) }
        { " " }
        <a
          href={`/taxon_changes/${item.taxon_change.id}`}
          target={linkTarget}
          className="linky"
        >
          { I18n.t( type ) }
        </a>
      </div>
    );
  }
  const viewerIsActor = config.currentUser && item.user.id === config.currentUser.id;
  const byClass = viewerIsActor ? "by-current-user" : "by-someone-else";
  let footer;
  if ( item.disagreement && !hideDisagreement ) {
    const previousTaxonLink = (
      <SplitTaxon
        taxon={item.previous_observation_taxon}
        url={urlForTaxon( item.previous_observation_taxon )}
        target={linkTarget}
        user={config.currentUser}
      />
    );
    const currentTaxonLink = (
      <SplitTaxon
        taxon={item.taxon}
        url={urlForTaxon( item.taxon )}
        target={linkTarget}
        user={config.currentUser}
      />
    );
    let footerText;
    if ( testingDisagreementTypes ) {
      if ( item.disagreement_type === "leaf" ) {
        footerText = I18n.t( "user_is_certain_this_is_not_taxon", {
          user: ReactDOMServer.renderToString( userLink ),
          taxon: ReactDOMServer.renderToString( previousTaxonLink )
        } );
      } else {
        footerText = I18n.t( "user_does_not_think_we_can_be_certain_beyond_taxon", {
          user: ReactDOMServer.renderToString( userLink ),
          taxon: ReactDOMServer.renderToString( currentTaxonLink )
        } );
      }
    } else {
      footerText = I18n.t( "user_disagrees_this_is_taxon", {
        user: ReactDOMServer.renderToString( userLink ),
        taxon: ReactDOMServer.renderToString( previousTaxonLink )
      } );
    }
    footer = (
      <span
        className="title_text"
        dangerouslySetInnerHTML={{
          __html: `* ${footerText}`
        }}
      />
    );
  }
  if ( item.implicitDisagreement ) {
    const footerText = I18n.t( "user_disagrees_with_previous_finer_identifications", {
      user: ReactDOMServer.renderToString( userLink )
    } );
    footer = (
      <span
        className="title_text"
        dangerouslySetInnerHTML={{
          __html: `* ${footerText}`
        }}
      />
    );
  }
  const elementID = isID ? `activity_identification_${item.id}` : `activity_comment_${item.id}`;
  const itemURL = isID ? `/identifications/${item.id}` : `/comments/${item.id}`;
  return (
    <div id={elementID} className={`ActivityItem ${className} ${byClass}`}>
      <div className="icon">
        <UserImage user={item.user} linkTarget={linkTarget} />
      </div>
      <Panel className={panelClass}>
        <Panel.Heading>
          <Panel.Title>
            <span className="title_text" dangerouslySetInnerHTML={{ __html: header }} />
            { headerItems }
            <time
              className="time"
              dateTime={item.created_at}
              title={moment( item.created_at ).format( "LLL" )}
            >
              <a href={itemURL} target={linkTarget}>{ relativeTime }</a>
            </time>
            <ActivityItemMenu
              item={item}
              observation={observation}
              config={config}
              deleteComment={deleteComment}
              deleteID={deleteID}
              restoreID={restoreID}
              setFlaggingModalState={setFlaggingModalState}
              linkTarget={linkTarget}
              trustUser={trustUser}
              untrustUser={untrustUser}
            />
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          { taxonChange }
          <div className="contents">
            { contents }
          </div>
        </Panel.Body>
        { footer ? <Panel.Footer>{ footer }</Panel.Footer> : null }
      </Panel>
    </div>
  );
};

ActivityItem.propTypes = {
  item: PropTypes.object,
  config: PropTypes.object,
  currentUserID: PropTypes.object,
  observation: PropTypes.object,
  addID: PropTypes.func,
  deleteComment: PropTypes.func,
  deleteID: PropTypes.func,
  restoreID: PropTypes.func,
  setFlaggingModalState: PropTypes.func,
  linkTarget: PropTypes.string,
  hideCompare: PropTypes.bool,
  hideDisagreement: PropTypes.bool,
  hideCategory: PropTypes.bool,
  noTaxonLink: PropTypes.bool,
  onClickCompare: PropTypes.func,
  trustUser: PropTypes.func,
  untrustUser: PropTypes.func
};

export default ActivityItem;
