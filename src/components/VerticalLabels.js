import React from 'react';
import styled from 'styled-components';

const Label = styled.div`
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
`;

const VLabels = styled.div`
  position: absolute;
  right: calc(100% - 13px);
  bottom: ${({offsetBottom}) => offsetBottom}px;
  text-align: right;
  ${({canvasHeight, offsetBottom, offsetTop, gridTop, labelFontSize, gridLinesCount}) => {
    const gridHeight = canvasHeight - offsetBottom - offsetTop - gridTop + labelFontSize;
    return {height: gridHeight, gridRowGap: (gridHeight - (gridLinesCount + 1) * labelFontSize) / gridLinesCount};
  }};
  display: grid;
  grid-template-rows: repeat(${({gridLinesCount, labelFontSize}) => `${gridLinesCount + 1}, ${labelFontSize}`}px);

  ${Label} {
    align-self: center;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.75);

    &:first-child {
      align-self: start;
    }

    &:last-child {
      align-self: end;
    }
  }
`;

const VerticalLabels = ({canvasHeight, canvasPadding, maxTotal, gridLinesCount}) => {
  const {bottom, top, gridTop} = canvasPadding;
  const gridLabelYStep = maxTotal / gridLinesCount;
  const labelsCountArray = Array(gridLinesCount + 1).fill(0)
    .map((i, idx) => Math.floor(maxTotal - gridLabelYStep * idx));

  return (
    <VLabels
      offsetBottom={bottom}
      offsetTop={top}
      gridTop={gridTop}
      labelFontSize={12}
      gridLinesCount={gridLinesCount}
      canvasHeight={canvasHeight}
    >
      {labelsCountArray.map((count, idx) => (
        <Label key={idx}>{count}</Label>
      ))}
    </VLabels>
  )
};

export default VerticalLabels;