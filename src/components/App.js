import React, {useState, useMemo} from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import moment from 'moment';
import BarChart from './BarChart';
import {getMinMaxTime, getModel} from '../utils/barChartUtils';
import Consts from '../constants/barChartConsts';

const {FAKE_DATA, CHART_DATE_FORMAT} = Consts;

const Wrapper = styled.div`
  padding: 20px;
  width: 100%;
  height: 100%;
  background-color: peachpuff;

  display: grid;
  grid-template-rows: 265px auto;
  grid-row-gap: 20px;
`;

const TimeBlock = styled.div`
  background-color: white;
  display: grid;
  grid-template-columns: 150px auto;
  grid-template-rows: min-content;
  grid-column-gap: 20px;
`;

const TimeData = styled.div``;

const Note = styled.div`
  grid-column: 1 / 3;
`;

const App = () => {
  const [timeFrom, setTimeFrom] = useState(null);
  const [timeTo, setTimeTo] = useState(null);

  // ofc useMemo is unnecessary since we have a FAKE_DATA but in real situation we don't need re-calculations
  const [min, max] = useMemo(() => getMinMaxTime(FAKE_DATA), [FAKE_DATA]);
  const model = useMemo(() => getModel(FAKE_DATA), [FAKE_DATA]);

  const changeDate = ({from, to}) => {
    setTimeFrom(_.isUndefined(from) ? timeFrom : from);
    setTimeTo(_.isUndefined(to) ? timeTo : to);
  };

  const handleDateDebouncer = _.debounce(changeDate, 100, {leading: false, trailing: true});

  const handleDateChange = (date) => {
    handleDateDebouncer.cancel();
    handleDateDebouncer(date);
  };

  const formatTime = (time) => time ? moment(time).format(CHART_DATE_FORMAT) : '-';

  return (
    <Wrapper>
      <BarChart
        min={min}
        max={max}
        data={model}
        onDateChange={handleDateChange}
      />
      <TimeBlock>
        <TimeData>Time-selection from:</TimeData>
        <TimeData>{formatTime(timeFrom)}</TimeData>
        <TimeData>Time-selection to:</TimeData>
        <TimeData>{formatTime(timeTo)}</TimeData>
        <Note>
          In this block we may have a table that will be filled with a data sorted according to time-selection
        </Note>
      </TimeBlock>
    </Wrapper>
  )
};

export default App;
