import React from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import moment from "moment";
import _ from "lodash";
import UserImage from "../../../shared/components/user_image";
import UserLink from "../../../shared/components/user_link";

const Streaks = ( {
  data,
  year,
  hideUsers
} ) => {
  const scale = d3.scaleTime( )
    .domain( [new Date( `${year}-01-01` ), new Date( `${year}-12-31` )] )
    .range( [0, 1.0] );
  const ticks = scale.ticks();
  const days = data.map( d => d.days );
  const dayScale = d3.scaleLog( )
    .domain( [d3.min( days ), d3.max( days )] )
    .range( [0, 0.8] );
  const d3Locale = d3.timeFormatLocale( {
    datetime: I18n.t( "time.formats.long" ),
    date: I18n.t( "date.formats.long" ),
    time: I18n.t( "time.formats.hours" ),
    periods: [I18n.t( "time.am" ), I18n.t( "time.pm" )],
    days: I18n.t( "date.day_names" ),
    shortDays: I18n.t( "date.abbr_day_names" ),
    months: _.compact( I18n.t( "date.month_names" ) ),
    shortMonths: _.compact( I18n.t( "date.abbr_month_names" ) )
  } );
  const shortDate = d3Locale.format( I18n.t( "date.formats.compact" ) );
  return (
    <div className="Streaks">
      <h3>
        <a name="streaks" href="#streaks">
          <span>{ I18n.t( "views.stats.year.observation_streaks" ) }</span>
        </a>
      </h3>
      <p className="text-muted">
        { I18n.t( "views.stats.year.observation_streaks_desc" ) }
      </p>
      <div className="rows">
        <div
          className="ticks streak"
          key="streaks-ticks"
        >
          { !hideUsers && <div className="user" /> }
          <div className="background">
            { ticks.map( ( tick, i ) => {
              const tickDate = new Date( tick );
              const left = i === 0
                ? 0
                : Math.max( 0, scale( tickDate ) );
              const tickWidth = i === ticks.length - 1
                ? 1 - scale( tickDate )
                : scale( ticks[i + 1] ) - scale( tickDate );
              return (
                <div
                  className={`tick ${i % 2 === 0 ? "alt" : ""}`}
                  key={`streaks-ticks-${tick}`}
                  style={{
                    left: `${left * 100}%`,
                    height: 35.6 * data.length + 35.6,
                    width: `${tickWidth * 100}%`
                  }}
                >
                  { moment( tick ).format( "MMM" ) }
                </div>
              );
            } ) }
          </div>
        </div>
        { data.map( streak => {
          const x1 = Math.max( 0, scale( new Date( streak.start ) ) );
          const x2 = scale( new Date( streak.stop ) );
          const width = Math.min( 1, x2 - x1 );
          const user = {
            login: streak.login,
            id: streak.user_id,
            icon_url: streak.icon_url
          };
          const xDays = I18n.t( "datetime.distance_in_words.x_days", { count: I18n.toNumber( streak.days, { precision: 0 } ) } );
          const streakStartedBeforeYear = moment( streak.start ) < moment( `${year}-01-01` );
          const d1 = streakStartedBeforeYear
            ? moment( streak.start ).format( "ll" )
            : shortDate( moment( streak.start ) );
          const d2 = shortDate( moment( streak.stop ) );
          return (
            <div
              key={`streaks-${streak.login}-${streak.start}`}
              className="streak"
            >
              { !hideUsers && (
                <div className="user">
                  <UserImage user={user} />
                  <UserLink user={user} />
                </div>
              ) }
              <div className="background">
                <a
                  className="datum"
                  href={`/observations?user_id=${streak.login}&d1=${streak.start}&d2=${streak.stop}&place_id=any&verifiable=true`}
                  style={{
                    left: `${Math.max( 0, x1 * 100 )}%`,
                    width: `${width * 100}%`,
                    backgroundColor: d3.interpolateWarm( dayScale( streak.days ) )
                  }}
                  title={`${I18n.t( "date_to_date", { d1, d2 } )} • ${xDays}`}
                >
                  { streakStartedBeforeYear && (
                    <span
                      className="triangle"
                      style={{ borderRightColor: d3.interpolateWarm( dayScale( streak.days ) ) }}
                    />
                  ) }
                  { width > 0.25 && <span className="start">{ d1 }</span> }
                  { width > 0.05 && <span className="days">{ xDays }</span> }
                  { width > 0.25 && <span className="stop">{ d2 }</span> }
                </a>
              </div>
            </div>
          );
        } ) }
      </div>
    </div>
  );
};

Streaks.propTypes = {
  // site: PropTypes.object,
  // user: PropTypes.object,
  year: PropTypes.number.isRequired,
  data: PropTypes.array.isRequired,
  hideUsers: PropTypes.bool
};

export default Streaks;
