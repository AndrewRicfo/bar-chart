import React from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import moment from 'moment';
import Consts from '../constants/barChartConsts';

const Label = styled.div`
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
`;

const HLabels = styled.div`
  position: absolute;
  bottom: 0;
  display: grid;
  grid-column-gap: ${({labelOffset}) => labelOffset}px;
  grid-template-columns: repeat(${({count}) => count}, 1fr);
  margin-left: ${({offsetLeft}) => offsetLeft}px;
  width: calc(100% - ${({offsetLeft}) => offsetLeft}px);
  text-align: center;
`;

const HorizontalLabels = (props) => {
  const {
    canvasPadding, timeToPixelCoefficient, canvasWidth, xAxisLabelOffset,
    xAxisLabelWidth, min, max,
  } = props;
  const {left, right} = canvasPadding;

  // canvas - left - right = (X * labelWidth) + ((X-1) * labelOffset)
  const maxLabelsCountThatCanFit = Math.floor((canvasWidth - left - right + xAxisLabelOffset) / (xAxisLabelWidth + xAxisLabelOffset));
  const timeDiffInMinutes = Math.ceil(
    moment.duration(moment(max).diff(moment(min))).as('minutes')
  );
  const labelsCount = Math.min(maxLabelsCountThatCanFit, timeDiffInMinutes);
  const interval = (max - min - xAxisLabelWidth * timeToPixelCoefficient) / (labelsCount - 1); // add half of labelWidth on each side
  const labelsTimeArray = _.uniq(
    Array(labelsCount).fill(null).map((i, idx) => {
      // start not from the min, but min+halfLabel
      const timePoint = min + xAxisLabelWidth / 2 * timeToPixelCoefficient + (interval * idx);
      let resultingTime;
      const firstLabel = _.isEqual(idx, 0);
      const lastLabel = _.isEqual(idx, labelsCount);
      // round minutes according to seconds if it's not First/Last label
      if (!firstLabel && !lastLabel && moment(timePoint).second() >= 30) {
        resultingTime = moment(timePoint).add(1, 'minute').startOf('minute');
      } else {
        resultingTime = moment(timePoint).startOf('minute');
      }
      return resultingTime;
    })
  );

  return (
    <HLabels
      count={labelsCount}
      offsetLeft={left}
      labelOffset={xAxisLabelOffset}
    >
      {labelsTimeArray.map(time => (
        <Label key={time.valueOf()}>{time.format(Consts.CHART_DATE_FORMAT)}</Label>
      ))}
    </HLabels>
  );
};

export default HorizontalLabels;