# Bar Chart
Bar chart with labels that represents 3 different types of data marked with different colors, written on ReactJS+canvas. 
The main purpose of that component is showing the user how the data was distributed over time and provide an ability to dig deeper with click & drag time-selection feature.
"From" and "to" values of time-selection are passed to the parent component and can be used to filter the data that could be represented in the table below.

## Features:
* mouse down + drag to create a time range
* clicking outside time range selection removes it
* click & drag time-selection to move it inside a chart
* X-axis labels are rendered dynamically: their number depends on width of chart and also data size (the number of horizontal labels <= time diff in minutes between MIN and MAX time from data entries, since the label format doesn't contain seconds)
* as well as labels, bars and time-selection also depend on width of the chart and rendered dynamically when you change the size the screen


## Pic. 1: Chart without time-selection
![graph](/screenshots/no-selection-big.png)

## Pic. 2: Chart with time-selection
![graph](/screenshots/with-selection-big.png)

## Pic.3: Chart with the same selection as on Pic.2 but on lower screen-size
![graph](/screenshots/with-selection.png)

------

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
