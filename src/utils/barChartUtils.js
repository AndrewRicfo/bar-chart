import _ from 'lodash';
import Consts from '../constants/barChartConsts';

export const getMinMaxTime = (data) => {
  if (_.isEmpty(data)) return [];

  const dataTimeArray = data.map(({detection}) => Object.values(detection)[0].time);
  let min = _.min(dataTimeArray);
  let max = _.max(dataTimeArray);
  const delta = max - min;
  if (delta > 0) {
    // at least two points on the chart
    const extraTimeOffset = 0.05;
    min -= extraTimeOffset * delta;
    max += extraTimeOffset * delta;
  } else {
    // only one point on the chart
    const halfDay = 1000 * 60 * 60 * 12;
    min -= halfDay;
    max += halfDay;
  }
  return [min, max];
};

export const getModel = (data) => {
  const formattedData = [];

  for (let i = 0; i < data.length; i++) {
    const {etype, eid, detection} = data[i];
    const type = _.capitalize(_.isEqual(etype, 'principal') ? 'user' : etype);

    const detectionTypes = _(detection).values().map(({category}) => category.split(Consts.CATEGORY_PREFIX)[1]).groupBy().value();
    const total = {
      anomaly: detectionTypes.anomaly ? detectionTypes.anomaly.length : 0,
      incident: detectionTypes.incident ? detectionTypes.incident.length : 0,
    };
    formattedData.push({
      entity: `${type}: ${eid}`,
      time: _.first(Object.values(detection)).time,
      anomaly: total.anomaly,
      incident: total.incident,
      count: total.anomaly + total.incident,
    });
  }
  return formattedData;
}