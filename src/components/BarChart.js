import React, {memo, useRef, useEffect, useReducer, useMemo} from 'react';
import styled from 'styled-components';
import {ResizeObserver} from '@juggle/resize-observer';
import _ from 'lodash';
import HorizontalLabels from './HorizontalLabels';
import VerticalLabels from './VerticalLabels';
import Consts from '../constants/barChartConsts';

const {CHART_TITLE, MOUSE_LEFT_BUTTON_KEY, ENTITY_TYPES} = Consts;

const Container = styled.div`
  background-color: white;
  position: relative;
  height: 100%;
  width: calc(100vw - 40px);
  margin: 0 auto;
`;

const Title = styled.div`
  position: absolute;
  font-size: 10px;
  left: 16px;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
`;

const Canvas = styled.canvas`
  background: ${({theme: {basicWhite}}) => basicWhite};
  cursor: crosshair;
`;

const SizerElement = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
`;

const reducer = (state, action) => ({...state, ...action});

const areEqual = (prevProps, nextProps) => _.isEqual(prevProps.data, nextProps.data)
  && _.isEqual(prevProps.min, nextProps.min)
  && _.isEqual(prevProps.max, nextProps.max);

const BarChart = memo(({min, max, data = [], onDateChange}) => {
  const resizeTimeout = useRef(null);
  const sizerRef = useRef(null);
  const canvasRef = useRef();
  const canvasContainerRef = useRef();
  const xAxisLabelWidth = 70;
  const xAxisLabelOffset = 25;
  const gridLinesCount = 3;
  const barWidth = 5;
  const canvasPadding = {
    gridTop: 13,
    top: 27,
    left: 18,
    bottom: 18,
    right: 0,
  };
  const barColors = {
    [ENTITY_TYPES.PRINCIPAL]: 'rgb(161, 119, 255)',
    [ENTITY_TYPES.RESOURCE]: 'rgb(255, 187, 123)',
    [ENTITY_TYPES.CLUSTER]: 'rgb(114, 224, 240)',
  };

  const initialState = {
    canvasWidth: 0,
    canvasHeight: 0,
    dataGroupedByTime: {},
    maxTotal: 0,
    selectionStart: -1,
    selectionStartTime: -1,
    selectionEnd: -1,
    selectionEndTime: -1,
    isSelectionExist: false,
    isSelecting: false,
    isDraggingSelection: false,
    lastMouseX: 0,
  };

  const handleResize = () => {
    clearTimeout(resizeTimeout.current);
    resizeTimeout.current = setTimeout(() => {
      const {canvasWidth, canvasHeight} = calculateCanvasDimensions();
      dispatch({canvasWidth, canvasHeight});
    }, 100);
  };

  const ro = useMemo(() => new ResizeObserver(handleResize), []);

  useEffect(() => {
    const sizerElement = sizerRef.current;
    ro.observe(sizerElement);

    return () => ro.disconnect();
  }, []);

  const draw = (ctx) => {
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    drawGrid(ctx);
    drawAxis(ctx);
    state.selectionEnd > 0 && drawSelection(ctx);
    drawBars(ctx);
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const {maxTotal, dataGroupedByTime} = calculateBarTotal();
    const {canvasWidth, canvasHeight} = calculateCanvasDimensions();

    dispatch({
      canvasWidth,
      canvasHeight,
      maxTotal,
      dataGroupedByTime,
    });
  }, []);

  useEffect(() => {
    const {selectionStartTime, selectionEndTime} = state;
    dispatch({
      selectionStart: calculateTimeToPixel(selectionStartTime),
      selectionEnd: calculateTimeToPixel(selectionEndTime),
    });
  }, [state.canvasWidth, state.canvasHeight]);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      draw(ctx);
    }
  }, [
    data,
    state.maxTotal,
    state.dataGroupedByTime,
    state.canvasWidth,
    state.canvasHeight,
    state.selectionStart,
    state.selectionEnd,
    state.lastMouseX,
  ]);

  useEffect(() => {
    const {maxTotal, dataGroupedByTime} = calculateBarTotal();
    dispatch({maxTotal, dataGroupedByTime});
  }, [data]);

  const drawAxis = (ctx) => {
    const {bottom, top} = canvasPadding;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E5E5';
    ctx.beginPath();
    ctx.moveTo(bottom, top);
    ctx.lineTo(bottom, state.canvasHeight - bottom);
    ctx.lineTo(state.canvasWidth, state.canvasHeight - bottom);
    ctx.stroke();
  };

  const drawGrid = (ctx) => {
    const {top, gridTop, bottom, left} = canvasPadding;
    const gridHeight = state.canvasHeight - bottom - top - gridTop;
    const gridLineGap = gridHeight / gridLinesCount;
    const lineCoordinatesY = Array(gridLinesCount).fill(0).map((i, idx) => top + gridTop + idx * gridLineGap);

    ctx.lineWidth = 1;
    lineCoordinatesY.forEach((coordinate, idx) => {
      ctx.strokeStyle = _.isEqual(idx, 1) ? '#D3D3D3' : '#F5F5F5';
      ctx.beginPath();
      ctx.moveTo(left, coordinate);
      ctx.lineTo(state.canvasWidth, coordinate);
      ctx.stroke();
    });
  };

  const drawBars = (ctx) => {
    const {right, left, top, bottom, gridTop} = canvasPadding;

    const activeWidth = state.canvasWidth - left - right;
    const activeHeight = state.canvasHeight - top - bottom - gridTop;

    const getBarCoefficient = (barTime) => (barTime - min) / (max - min);
    const uniqueTimeArray = Object.keys(state.dataGroupedByTime);
    const barCoordinatesX = uniqueTimeArray.map(time => getBarCoefficient(time) * activeWidth);

    const verticalBarCoefficient = activeHeight / state.maxTotal;

    uniqueTimeArray.forEach((timeKey, index) => {
      const currentXCoord = barCoordinatesX[index];
      const dataKeys = Object.keys(state.dataGroupedByTime[timeKey]);

      dataKeys.forEach((key, index) => {
        const getPreviousBarsHeight = (_index) =>
          _index > 0
            ? state.dataGroupedByTime[timeKey][dataKeys[_index]] + getPreviousBarsHeight(_index - 1)
            : state.dataGroupedByTime[timeKey][dataKeys[_index]];

        if (_.isEqual(state.dataGroupedByTime[timeKey][key], 0) || _.isEqual(key, 'total')) {
          // skip zero value and (key === 'total')
          return;
        }

        const barHeightStartCoordinate = getPreviousBarsHeight(index);

        ctx.fillStyle = barColors[key];
        ctx.fillRect(
          currentXCoord - barWidth / 2,
          (activeHeight + top + gridTop) - barHeightStartCoordinate * verticalBarCoefficient,
          barWidth,
          state.dataGroupedByTime[timeKey][key] * verticalBarCoefficient
        );
      });
    });
  };

  const drawSelection = (ctx) => {
    const {top, bottom} = canvasPadding;

    const start = calculateTimeToPixel(state.selectionStartTime);
    const end = calculateTimeToPixel(state.selectionEndTime);

    ctx.strokeStyle = '#979797';
    ctx.beginPath();
    ctx.moveTo(start, state.canvasHeight - bottom);
    ctx.lineTo(start, top);
    ctx.moveTo(end, state.canvasHeight - bottom);
    ctx.lineTo(end, top);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(start, top, end - start, state.canvasHeight - top - bottom);
  };

  const calculateCanvasDimensions = () => {
    const containerEl = canvasContainerRef.current;
    const {clientWidth, clientHeight} = containerEl;

    return {
      canvasWidth: clientWidth,
      canvasHeight: clientHeight,
    }
  };

  const calculateBarTotal = () => {
    let dataGroupedByTime = {};

    data.forEach(({time, count, entity}) => {
      const entityType = _(entity).split(':').first();
      dataGroupedByTime[time] = {
        [ENTITY_TYPES.PRINCIPAL]: 0,
        [ENTITY_TYPES.RESOURCE]: 0,
        [ENTITY_TYPES.CLUSTER]: 0,
        ...dataGroupedByTime[time],
        [entityType]: (dataGroupedByTime[time] && dataGroupedByTime[time][entityType] || 0) + count,
        total: (dataGroupedByTime[time] && dataGroupedByTime[time].total || 0) + count,
      };
    });

    const maxTotal = _(dataGroupedByTime).map('total').max();
    return {maxTotal, dataGroupedByTime};
  };

  const getTimeToPixelCoefficient = () => {
    const {left, right} = canvasPadding;
    return (max - min) / (state.canvasWidth - left - right);
  };

  const calculatePixelToTime = (coordinate) => {
    const timeToPixelCoefficient = getTimeToPixelCoefficient();
    return min + coordinate * timeToPixelCoefficient;
  };

  const calculateTimeToPixel = (time) => {
    if (time >= 0) {

      const {canvasWidth} = calculateCanvasDimensions();
      const {left, right} = canvasPadding;
      const coefficient = (time - min) / (max - min);
      const canvasActiveArea = canvasWidth - right - left;

      return Math.round(canvasActiveArea * coefficient);
    } else {
      return -1;
    }
  };

  const handleMouseDown = ({clientX, target, nativeEvent: {which}}) => {
    if (!_.isEqual(which, MOUSE_LEFT_BUTTON_KEY)) return;

    const {left, right} = canvasPadding;
    const canvasX = target.getBoundingClientRect().x;
    const mouseInCanvasX = clientX - canvasX;
    const isClickedInsideSelection = (mouseInCanvasX <= state.selectionEnd && mouseInCanvasX >= state.selectionStart);
    const isClickInsideActiveArea = (mouseInCanvasX <= state.canvasWidth - left - right && mouseInCanvasX >= left);
    const selectionStartTime = calculatePixelToTime(mouseInCanvasX);

    if (!isClickInsideActiveArea) return;

    if (state.isSelectionExist) {
      if (isClickedInsideSelection) {
        dispatch({isDraggingSelection: true, lastMouseX: clientX})
      } else {
        onDateChange({from: selectionStartTime, to: null});
        dispatch({
          isSelecting: true,
          selectionStart: mouseInCanvasX,
          selectionStartTime,
          selectionEnd: -1,
          selectionEndTime: -1,
          lastMouseX: clientX,
          isSelectionExist: false,
        });
      }
    } else {
      onDateChange({from: selectionStartTime});
      dispatch({
        isSelecting: true,
        selectionStart: mouseInCanvasX,
        selectionStartTime,
        lastMouseX: clientX,
      });
    }
  };

  const handleMouseMove = ({clientX, target, nativeEvent: {which}}) => {
    if (!_.isEqual(which, MOUSE_LEFT_BUTTON_KEY)) return;

    const {left, right} = canvasPadding;
    const canvasX = target.getBoundingClientRect().x;
    const mouseInCanvasX = clientX - canvasX;
    const isMouseInside = mouseInCanvasX >= left && mouseInCanvasX <= state.canvasWidth - right;

    if (state.isSelecting && isMouseInside) {
      const selectionEndTime = calculatePixelToTime(mouseInCanvasX);
      const lowerValue = Math.min(state.selectionStartTime, selectionEndTime);
      const biggerValue = Math.max(state.selectionStartTime, selectionEndTime);
      onDateChange({from: lowerValue, to: biggerValue});
      dispatch({selectionEnd: mouseInCanvasX, selectionEndTime});
    }

    if (state.isDraggingSelection) {
      const moveDelta = clientX - state.lastMouseX;
      const prevSelectionLength = state.selectionEnd - state.selectionStart;

      const newSelectionStart = Math.max(state.selectionStart + moveDelta, left);
      const newSelectionEnd = Math.min(state.selectionEnd + moveDelta, state.canvasWidth - right);
      const nextSelectionLength = newSelectionEnd - newSelectionStart;

      if (_.isEqual(prevSelectionLength, nextSelectionLength)) {
        const selectionStartTime = calculatePixelToTime(newSelectionStart);
        const selectionEndTime = calculatePixelToTime(newSelectionEnd);
        onDateChange({from: selectionStartTime, to: selectionEndTime});
        dispatch({
          lastMouseX: clientX,
          selectionStart: newSelectionStart,
          selectionStartTime,
          selectionEnd: newSelectionEnd,
          selectionEndTime,
        });
      } else {
        const limitedSelectionStart = _.isEqual(newSelectionStart, left) ? left : Math.min(newSelectionStart, state.canvasWidth - right - prevSelectionLength);
        const limitedSelectionEnd = _.isEqual(newSelectionEnd, right) ? right : Math.max(newSelectionEnd, left + prevSelectionLength);
        const selectionStartTime = calculatePixelToTime(limitedSelectionStart);
        const selectionEndTime = calculatePixelToTime(limitedSelectionEnd);
        onDateChange({from: selectionStartTime, to: selectionEndTime});
        dispatch({
          lastMouseX: clientX,
          selectionStart: limitedSelectionStart,
          selectionStartTime: calculatePixelToTime(limitedSelectionStart),
          selectionEnd: limitedSelectionEnd,
          selectionEndTime: calculatePixelToTime(limitedSelectionEnd),
        });
      }
    }
  };

  const handleMouseUp = ({clientX, nativeEvent: {which}}) => {
    if (!_.isEqual(which, MOUSE_LEFT_BUTTON_KEY)) return;

    const clickedOnePoint = _.isEqual(state.lastMouseX, clientX);

    if (clickedOnePoint && _.isEqual(state.selectionEnd, -1)) {
      onDateChange({from: null, to: null});
      dispatch({
        isSelecting: false,
        selectionStart: -1,
        selectionStartTime: -1,
        selectionEnd: -1,
        selectionEndTime: -1,
      });
    } else {
      const lowerValue = Math.min(state.selectionStart, state.selectionEnd);
      const biggerValue = Math.max(state.selectionStart, state.selectionEnd);
      const selectionStartTime = calculatePixelToTime(lowerValue);
      const selectionEndTime = calculatePixelToTime(biggerValue);

      if (state.isSelectionExist) {
        if (state.isDraggingSelection) {
          dispatch({isDraggingSelection: false});
          onDateChange({from: selectionStartTime, to: selectionEndTime});
        } else {
          onDateChange({from: null, to: null});
          dispatch({
            isSelectionExist: false,
            isSelecting: false,
            selectionStart: -1,
            selectionStartTime: -1,
            selectionEnd: -1,
            selectionEndTime: -1,
          });
        }
      } else {
        onDateChange({from: selectionStartTime, to: selectionEndTime});
        dispatch({
          isSelectionExist: true,
          isSelecting: false,
          selectionStart: lowerValue,
          selectionStartTime,
          selectionEnd: biggerValue,
          selectionEndTime,
        });
      }
    }
  };

  const handleMouseOut = () => {
    const shouldReset = (state.isSelectionExist && state.isDraggingSelection) || (!state.isSelectionExist && state.isSelecting);
    if (shouldReset) {
      const fromTime = Math.min(state.selectionStartTime, state.selectionEndTime);
      const toTime = Math.max(state.selectionStartTime, state.selectionEndTime);
      onDateChange({from: fromTime, to: toTime});
      dispatch({
        isSelecting: false,
        isSelectionExist: true,
        isDraggingSelection: false,
        selectionStart: Math.min(state.selectionStart, state.selectionEnd),
        selectionStartTime: fromTime,
        selectionEnd: Math.max(state.selectionStart, state.selectionEnd),
        selectionEndTime: toTime,
      });
    }
  };

  return (
    <Container ref={canvasContainerRef}>
      <Title>{CHART_TITLE}</Title>
      <Canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
        width={state.canvasWidth}
        height={state.canvasHeight}
      />
      {state.maxTotal > 0 && (
        <VerticalLabels
          maxTotal={state.maxTotal}
          canvasHeight={state.canvasHeight}
          gridLinesCount={gridLinesCount}
          canvasPadding={canvasPadding}
        />
      )}
      {state.canvasWidth > 0 && (
        <HorizontalLabels
          timeToPixelCoefficient={getTimeToPixelCoefficient()}
          canvasPadding={canvasPadding}
          canvasWidth={state.canvasWidth}
          xAxisLabelOffset={xAxisLabelOffset}
          xAxisLabelWidth={xAxisLabelWidth}
          min={min}
          max={max}
        />
      )}
      <SizerElement ref={sizerRef} />
    </Container>
  )
}, areEqual);

export default BarChart;
