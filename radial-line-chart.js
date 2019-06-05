function RadialLineChart(options) {
  validateOptions(options);

  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  var activityTexts = {
    outbreak: "OUTBREAK",
    heightened: "HEIGHTENED",
    normal: "NORMAL ACTIVITY"
  };

  var table;
  var that = this;
  var data = options.data;
  var selector = options.selector;
  var thresholds = options.thresholds;
  var asymmetricalScaling = options.asymmetricalScaling || false;
  var chartSize = options.chartSize || 650;
  var radius = chartSize / 2;
  var outerRadius = radius - 10;
  var innerRadius = outerRadius * 0.6;
  var scale = getScale();

  this.render = function() {
    var container = d3.select(selector);
    if (container.empty()) {
      throw new Error("Container element not found");
    }

    appendButtons(container);
    renderChart(container);
    appendTooltip(container);

    if (!table) {
      table = container
        .append("div")
        .classed("chart-table-container", true)
        .append("table")
        .classed("chart-table", true);
    }
    var allYears = getAllYears();
    tableData = getTableData(allYears);
    renderTable(tableData);
  };

  this.setActiveYear = function(year) {
    var chartContainer = d3.select(selector);
    var activeLines = chartContainer.select("#active-lines");
    var inactiveLines = chartContainer.select("#inactive-lines");
    var lineOverlays = chartContainer.select("#line-overlays");

    var allYears = getAllYears();
    var yearsToEnable;
    if (!year) {
      yearsToEnable = allYears;
    } else {
      yearsToEnable = [year];
    }
    var yearsToDisable = getElementsOfArrayExcept(allYears, yearsToEnable);

    var activeYearbutton = d3.select(
      selector + ' .year-button[year="' + (year || "") + '"]'
    );
    var allYearbuttons = d3.selectAll(selector + " .year-button");
    allYearbuttons.classed("selected", false);
    activeYearbutton.classed("selected", true);

    enableYears(yearsToEnable, activeLines, inactiveLines, lineOverlays);
    disableYears(yearsToDisable, activeLines, inactiveLines, lineOverlays);

    // hack for IE not updating active/inactive line masks.
    forceChartRedraw();

    var tableData = getTableData(yearsToEnable);
    renderTable(tableData);
  };

  function renderChart(container) {
    var svg = container
      .append("svg")
      .attr("width", chartSize)
      .attr("height", chartSize)
      .attr(
        "viewBox",
        -radius + " " + -radius + " " + chartSize + " " + chartSize
      )
      .classed("chart-svg", true);

    var defs = svg.append("defs").classed("chart-defs", true);

    var chart = svg
      .append("g")
      .classed("chart", true)
      .attr("transform", "translate(5, 5)");

    renderThresholdCircles(chart);
    renderColorCircles(chart);
    renderLines(chart, defs);
    attachEventHandlers(chart);
  }

  function attachEventHandlers(chart) {
    var throttledMouseMoveFunc = throttle(200, onLineMouseMove);

    chart
      .selectAll("#line-overlays .line,.line-connector")
      .on("mousemove", throttledMouseMoveFunc)
      .on("mouseleave", hideTooltip);
  }

  function renderTable(tableData) {
    var rows = table.selectAll("tr").data(tableData);
    rows.enter().append("tr");
    rows.exit().remove();

    var columns = table
      .selectAll("tr")
      .selectAll("td")
      .data(function(d) {
        return d;
      });
    columns.enter().append("td");
    columns.exit().remove();

    table
      .selectAll("td")
      .attr("class", function(d) {
        if (!d || !d.activity) {
          return;
        }

        return d.activity;
      })
      .text(function(d) {
        if (!d) {
          return "";
        }

        if (!d.points) {
          return d;
        }

        return d.points;
      });
  }

  function renderLines(chart, defs) {
    var activeLines = defs.append("mask").attr("id", "active-lines");
    var inactiveLines = defs.append("mask").attr("id", "inactive-lines");
    var overlays = chart.append("g").attr("id", "line-overlays");
    var lineGenerator = getLineGenerator();

    for (var i = 0; i < data.years.length; i++) {
      var year = data.years[i].year;
      var lineContainer = activeLines
        .append("g")
        .classed("line-container line-container" + year, true);
      var overlayContainer = overlays
        .append("g")
        .classed("line-container line-container" + year, true);

      var lineClass = "line " + year;
      var yearDatum = getDatumOfYear(i);
      renderLine(lineContainer, yearDatum, lineClass, year, lineGenerator);
      renderLine(overlayContainer, yearDatum, lineClass, year, lineGenerator);

      var lineConnectorClass = "line-connector " + year;
      var lineConnectorDatum = getLineConnectorDatumOfYear(i);
      renderLineConnectors(
        lineContainer,
        lineConnectorDatum,
        lineConnectorClass,
        year,
        lineGenerator
      );
      renderLineConnectors(
        overlayContainer,
        lineConnectorDatum,
        lineConnectorClass,
        year,
        lineGenerator
      );
    }
  }

  function renderLineConnectors(
    container,
    datum,
    className,
    year,
    lineGenerator
  ) {
    if (datum.startDatum) {
      var startClass = "start-connector " + className;
      renderLine(container, datum.startDatum, startClass, year, lineGenerator);
    }

    if (datum.endDatum) {
      var endClass = "end-connector " + className;
      renderLine(container, datum.endDatum, endClass, year, lineGenerator);
    }
  }

  function renderLine(container, datum, className, year, lineGenerator) {
    container
      .append("path")
      .datum(datum)
      .classed(className, true)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("d", lineGenerator)
      .attr("year", year);
  }

  function renderColorCircles(chart) {
    var activeLinesMask = "url(#active-lines)";
    var inactiveLinesMask = "url(#inactive-lines)";
    var scaledOutbreak = scale.y(thresholds.outbreak);
    var scaledHeightened = scale.y(thresholds.heightened);
    var scaledMinValue = scale.y(data.minValue);

    var outbreakRadius = (outerRadius + scaledOutbreak) / 2;
    var outbreakStrokeWidth = outerRadius - scaledOutbreak;
    renderColorCircle(
      chart,
      "outbreak-inactive",
      outbreakRadius,
      outbreakStrokeWidth,
      inactiveLinesMask
    );
    renderColorCircle(
      chart,
      "outbreak-active",
      outbreakRadius,
      outbreakStrokeWidth,
      activeLinesMask
    );

    var heightenedRadius = (scaledOutbreak + scaledHeightened) / 2;
    var heightenedStrokeWidth = scaledOutbreak - scaledHeightened;
    renderColorCircle(
      chart,
      "heightened-inactive",
      heightenedRadius,
      heightenedStrokeWidth,
      inactiveLinesMask
    );
    renderColorCircle(
      chart,
      "heightened-active",
      heightenedRadius,
      heightenedStrokeWidth,
      activeLinesMask
    );

    var normalRadius = Math.min(scaledMinValue, scaledHeightened);
    var normalStrokeWidth = (scaledHeightened - scaledMinValue) * 2;
    renderColorCircle(
      chart,
      "normal-inactive",
      normalRadius,
      normalStrokeWidth,
      inactiveLinesMask
    );
    renderColorCircle(
      chart,
      "normal-active",
      normalRadius,
      normalStrokeWidth,
      activeLinesMask
    );
  }

  function renderColorCircle(chart, className, radius, strokeWidth, mask) {
    chart
      .append("circle")
      .classed(className, true)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radius)
      .attr("stroke-width", strokeWidth)
      .attr("fill", "none")
      .attr("mask", mask);
  }

  function renderThresholdCircles(chart) {
    renderThresholdCircle(chart, outerRadius);
    renderThresholdCircle(chart, scale.y(thresholds.outbreak));
    renderThresholdCircle(chart, scale.y(thresholds.heightened));
  }

  function renderThresholdCircle(chart, radius) {
    chart
      .append("circle")
      .classed("threshold-circle", true)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radius)
      .attr("fill", "none");
  }

  function appendButtons(container) {
    var buttonContainer = container
      .append("div")
      .classed("chart-buttons", true);

    appendYearButton(buttonContainer, "ALL", "", true);

    for (var i = 0; i < data.years.length; i++) {
      var year = data.years[i].year;
      appendYearButton(buttonContainer, year, year, false);
    }
  }

  function appendYearButton(container, text, year, selected) {
    container
      .append("button")
      .classed("year-button", true)
      .classed("selected", selected)
      .attr("year", year)
      .text(text)
      .on("click.year-button", onClickYearButton);
  }

  function appendTooltip(container) {
    var tooltip = container.append("div").classed("tooltip", true);
    var tooltipContainer = tooltip
      .append("div")
      .classed("tooltip-container", true);
    var tooltipCard = tooltipContainer
      .append("div")
      .classed("tooltip-card", true);

    var dateDiv = tooltipCard.append("div").classed("date-container", true);
    dateDiv
      .append("span")
      .classed("date-title", true)
      .text("DATE");
    dateDiv
      .append("span")
      .classed("date", true)
      .text("Jan 14 - Jan 20, 2018");

    var statusDiv = tooltipCard.append("div").classed("status-container", true);
    statusDiv
      .append("span")
      .classed("status-title", true)
      .text("STATUS");
    statusDiv
      .append("span")
      .classed("status", true)
      .text("+ 6 Points");

    tooltipCard
      .append("div")
      .classed("activity", true)
      .text("NORMAL ACTIVITY");

    var circle1 = tooltipContainer
      .append("div")
      .classed("circle circle1", true);
    var circle2 = circle1.append("div").classed("circle circle2", true);
    var circle3 = circle2.append("div").classed("circle circle3", true);
  }

  function findClosestEntryToDate(date, yearIndex) {
    var yearEntries = data.years[yearIndex].entries;
    var bisect = d3.bisector(function(d) {
      return d.midDate;
    }).left;

    var index = bisect(yearEntries, date);
    if (index >= yearEntries.length) {
      index -= 1;
    }

    var rightEntry = yearEntries[index];
    var leftEntry;
    if (index > 0) {
      leftEntry = yearEntries[index - 1];
    } else {
      leftEntry = yearEntries[0];
    }

    return getClosestEntryToDate(date, leftEntry, rightEntry);
  }

  function findClosestEntryOfLineConnectorDate(date, lineConnector, yearIndex) {
    if (lineConnector.classed("start-connector")) {
      var lastEntryOfPreviousYear = getLastEntryOfYear(yearIndex - 1);
      var firstEntryOfCurrentYear = getFirstEntryOfYear(yearIndex);

      return getClosestEntryToDate(
        date,
        lastEntryOfPreviousYear,
        firstEntryOfCurrentYear
      );
    } else {
      var lastEntryOfCurrentYear = getLastEntryOfYear(yearIndex);
      var firstEntryOfNextYear = getFirstEntryOfYear(yearIndex + 1);

      return getClosestEntryToDate(
        date,
        lastEntryOfCurrentYear,
        firstEntryOfNextYear
      );
    }
  }

  function getDomLocationFromChartCoordinates(coordinates) {
    var chart = d3.select(selector + " .chart");
    var bodyRect = document.body.getBoundingClientRect();
    var chartRect = chart.node().getBoundingClientRect();

    var domX = chartRect.left - bodyRect.left + radius - 10 + coordinates.x;
    var domY = chartRect.top - bodyRect.top + radius - 10 + coordinates.y;

    return {
      x: domX,
      y: domY
    };
  }

  function getYearIndexOfYear(year) {
    for (var i = 0; i < data.years.length; i++) {
      if (data.years[i].year === year) {
        return i;
      }
    }
  }

  function getQuadrantOfLocation(location) {
    var radians = Math.atan2(location.y, location.x);

    if (radians < -1.57) {
      return "top-left";
    } else if (radians < 0) {
      return "top-right";
    } else if (radians < 1.57) {
      return "bottom-right";
    } else {
      return "bottom-left";
    }
  }

  function getClosestEntryToDate(date, leftEntry, rightEntry) {
    return date - leftEntry.midDate > rightEntry.midDate - date
      ? rightEntry
      : leftEntry;
  }

  function getDateOfLocation(x, y, year) {
    var yearDifference = year - data.years[0].year;
    var radians = Math.atan2(y, x);
    var shiftedRadians = radians + Math.PI * 2.5;
    var normalizedRadians = shiftedRadians % (2 * Math.PI);
    var yearlyRadians = normalizedRadians + yearDifference * 2 * Math.PI;

    return scale.x.invert(yearlyRadians);
  }

  function getLocationOfEntry(dataEntry) {
    var radians = scale.x(dataEntry.midDate);
    var radius = scale.y(dataEntry.value);
    var x = radius * Math.sin(radians);
    var y = radius * -Math.cos(radians);

    return {
      x: x,
      y: y
    };
  }

  function getDatumOfYear(yearIndex) {
    var hasPreviousYear = yearIndex > 0;
    var hasFollowingYear = yearIndex < data.years.length - 1;
    var datum = data.years[yearIndex].entries.slice();

    if (hasPreviousYear) {
      var previousYearLastEntry = getLastEntryOfYear(yearIndex - 1);
      datum.splice(0, 0, previousYearLastEntry);
    } else {
      var currentYearFirstEntry = getFirstEntryOfYear(yearIndex);
      datum.splice(0, 0, currentYearFirstEntry);
    }

    if (hasFollowingYear) {
      var followingYearFirstEntry = getFirstEntryOfYear(yearIndex + 1);
      datum.push(followingYearFirstEntry);
    } else {
      var currentYearLastEntry = getLastEntryOfYear(yearIndex);
      datum.push(currentYearLastEntry);
    }

    return datum;
  }

  function getLineConnectorDatumOfYear(yearIndex) {
    var hasPreviousYear = yearIndex > 0;
    var hasFollowingYear = yearIndex < data.years.length - 1;
    var startDatum;
    var endDatum;

    if (hasPreviousYear) {
      var previousYearLastEntry = getLastEntryOfYear(yearIndex - 1);
      var currentYearFirstEntry = getFirstEntryOfYear(yearIndex);
      var currentYearSecondEntry = getSecondEntryOfYear(yearIndex);
      var startConnectorEntry = getStartConnectorEntryOfYear(
        yearIndex,
        previousYearLastEntry,
        currentYearFirstEntry
      );

      startDatum = [];
      startDatum.push(previousYearLastEntry);
      startDatum.push(startConnectorEntry);
      startDatum.push(currentYearFirstEntry);
      startDatum.push(currentYearSecondEntry);
    }

    if (hasFollowingYear) {
      var currentYearSecondToLastEntry = getSecondToLastEntryOfYear(yearIndex);
      var currentYearLastEntry = getLastEntryOfYear(yearIndex);
      var followingYearFirstEntry = getFirstEntryOfYear(yearIndex + 1);
      var endConnectorEntry = getEndConnectorEntryOfYear(
        yearIndex,
        currentYearLastEntry,
        followingYearFirstEntry
      );

      endDatum = [];
      endDatum.push(currentYearSecondToLastEntry);
      endDatum.push(currentYearLastEntry);
      endDatum.push(endConnectorEntry);
      endDatum.push(followingYearFirstEntry);
    }

    return {
      startDatum: startDatum,
      endDatum: endDatum
    };
  }

  function getStartConnectorEntryOfYear(
    yearIndex,
    previousYearLastEntry,
    currentYearFirstEntry
  ) {
    var year = data.years[yearIndex].year;
    var dateStartOfYear = new Date(year, 0, 1);

    return getConnectorEntry(
      previousYearLastEntry,
      currentYearFirstEntry,
      dateStartOfYear
    );
  }

  function getEndConnectorEntryOfYear(
    yearIndex,
    currentYearLastEntry,
    followingYearFirstEntry
  ) {
    var year = data.years[yearIndex].year;
    var dateStartOfNextYear = new Date(year + 1, 0, 1);
    var dateEndOfYear = new Date(dateStartOfNextYear.getTime() - 1000);

    return getConnectorEntry(
      currentYearLastEntry,
      followingYearFirstEntry,
      dateEndOfYear
    );
  }

  function getConnectorEntry(entryA, entryB, connectorDate) {
    var scaleValue = d3
      .scaleTime()
      .domain([entryA.midDate, entryB.midDate])
      .range([entryA.value, entryB.value]);

    return {
      midDate: connectorDate,
      value: scaleValue(connectorDate)
    };
  }

  function getFirstEntryOfYear(yearIndex) {
    var year = data.years[yearIndex].entries;
    return year[0];
  }

  function getSecondEntryOfYear(yearIndex) {
    var year = data.years[yearIndex].entries;
    if (year.length === 1) {
      return year[0];
    }

    return year[1];
  }

  function getLastEntryOfYear(yearIndex) {
    var year = data.years[yearIndex].entries;
    return year[year.length - 1];
  }

  function getSecondToLastEntryOfYear(yearIndex) {
    var year = data.years[yearIndex].entries;
    if (year.length === 1) {
      return year[0];
    }

    return year[year.length - 2];
  }

  function getLineGenerator() {
    return d3
      .radialLine()
      .curve(d3.curveCardinalOpen)
      .angle(function(d) {
        return scale.x(d.midDate);
      })
      .radius(function(d) {
        return scale.y(d.value);
      });
  }

  function getScale() {
    var firstYear = data.years[0].year;
    var scaleX = d3
      .scaleTime()
      .domain([new Date(firstYear, 0, 1), new Date(firstYear, 11, 31)])
      .range([0, 2 * Math.PI]);

    var scaleY;
    if (asymmetricalScaling) {
      scaleY = d3
        .scaleLinear()
        .domain([
          data.minValue,
          thresholds.heightened,
          thresholds.outbreak,
          data.maxValue
        ])
        .range([
          innerRadius,
          outerRadius * 0.72,
          outerRadius * 0.86,
          outerRadius - 10
        ]);
    } else {
      scaleY = d3
        .scaleLinear()
        .domain([data.minValue, data.maxValue])
        .range([innerRadius, outerRadius - 10]);
    }

    return {
      x: scaleX,
      y: scaleY
    };
  }

  function getTableData(years) {
    var day = 1000 * 60 * 60 * 24;
    var dateColumn = getTableDateColumn();
    var headerRow = getTableHeaderRowFromYears(years);
    var tableData = [];

    tableData.push(headerRow);

    for (var i = 0; i < dateColumn.length; i++) {
      var tableRow = [];
      var dateCell = dateColumn[i];
      tableRow.push(dateCell.text);

      years.forEach(function(year) {
        var statusCell;
        var yearIndex = getYearIndexOfYear(year);
        var adjustedDate = getDateWithAddedYears(dateCell.midDate, yearIndex);
        var closestEntry = findClosestEntryToDate(adjustedDate, yearIndex);
        var dateDifference = Math.abs(adjustedDate - closestEntry.midDate);
        var differenceInDays = dateDifference / day;
        if (differenceInDays > 6) {
          tableRow.push(undefined);
          return;
        }

        var points = getStatusTextOfEntry(closestEntry);
        var activity = getActivityOfEntry(closestEntry);

        statusCell = {
          points: points,
          activity: activity,
          entry: closestEntry
        };

        tableRow.push(statusCell);
      });

      var rowHasAnyValues = false;
      for (var j = 1; j < tableRow.length; j++) {
        var cell = tableRow[j];
        if (cell) {
          rowHasAnyValues = true;
          break;
        }
      }

      if (rowHasAnyValues) {
        tableData.push(tableRow);
      }
    }

    return tableData;
  }

  function getTableHeaderRowFromYears(years) {
    var headerData = [];
    headerData.push("");
    for (var i = 0; i < years.length; i++) {
      var year = years[i];
      headerData.push(year);
    }

    return headerData;
  }

  function getDateWithAddedDays(date, daysToAdd) {
    var dateCopy = new Date(date.getTime());
    dateCopy.setDate(dateCopy.getDate() + daysToAdd);

    return dateCopy;
  }

  function getDateWithAddedYears(date, yearsToAdd) {
    var dateCopy = new Date(date.getTime());
    dateCopy.setFullYear(date.getFullYear() + yearsToAdd);

    return dateCopy;
  }

  function getTableDateColumn() {
    var tableDateColumn = [];
    var baseEntries = data.years[0].entries;

    for (var i = 0; i < baseEntries.length; i++) {
      var entry = baseEntries[i];
      var isFirstEntry = i === 0;

      if (isFirstEntry) {
        backfillTableDateColumn(tableDateColumn, entry);
      }

      var dateText = getDateTextOfEntry(entry);
      tableDateColumn.push({
        text: dateText,
        midDate: entry.midDate
      });
    }

    return tableDateColumn;
  }

  function getActivityOfEntry(entry) {
    if (entry.value >= thresholds.outbreak) {
      return "outbreak";
    } else if (entry.value >= thresholds.heightened) {
      return "heightened";
    } else {
      return "normal";
    }
  }

  function getStatusTextOfEntry(entry) {
    var points = Math.round((entry.value / thresholds.heightened) * 100 - 100);
    var pointsText = Math.abs(points) + " Points";
    if (points < 0) {
      pointsText = "- " + pointsText;
    } else {
      pointsText = "+ " + pointsText;
    }

    return pointsText;
  }

  function getDateTextOfEntry(entry, appendYear) {
    var startMonth = months[entry.startDate.getMonth()];
    var startDate = entry.startDate.getDate();
    var endMonth = months[entry.endDate.getMonth()];
    var endDate = entry.endDate.getDate();
    var entryYear = entry.endDate.getFullYear();

    var dateText =
      startMonth + " " + startDate + " - " + endMonth + " " + endDate;
    if (appendYear) {
      dateText += ", " + entryYear;
    }

    return dateText;
  }

  function getAllYears() {
    return data.years.map(function(year) {
      return year.year;
    });
  }

  function getElementsOfArrayExcept(sourceArray, exceptArray) {
    return sourceArray.filter(function(obj) {
      return exceptArray.indexOf(obj) < 0;
    });
  }

  function disableYears(years, activeLines, inactiveLines, lineOverlays) {
    if (years.length === 0) {
      return;
    }

    var selector = buildLineContainerSelectorForYears(years);
    activeLines.selectAll(selector).select(function() {
      var node = this;
      inactiveLines.append(function() {
        return node;
      });
    });

    lineOverlays.selectAll(selector).classed("disabled", true);
  }

  function enableYears(years, activeLines, inactiveLines, lineOverlays) {
    if (years.length === 0) {
      return;
    }

    var selector = buildLineContainerSelectorForYears(years);
    inactiveLines.selectAll(selector).select(function() {
      var node = this;
      activeLines.append(function() {
        return node;
      });
    });

    lineOverlays.selectAll(selector).classed("disabled", false);
  }

  function backfillTableDateColumn(column, firstEntry) {
    var entryYear = firstEntry.endDate.getFullYear();
    var startDate = firstEntry.startDate;
    var midDate = firstEntry.midDate;
    var endDate = firstEntry.endDate;

    while (true) {
      endDate = getDateWithAddedDays(endDate, -7);
      if (endDate.getFullYear() !== entryYear) {
        break;
      }

      startDate = getDateWithAddedDays(startDate, -7);
      midDate = getDateWithAddedDays(midDate, -7);

      var dateText = getDateTextOfEntry({
        startDate: startDate,
        midDate: midDate,
        endDate: endDate
      });

      column.push({
        text: dateText,
        midDate: midDate
      });
    }
  }

  function showTooltip(entry, domLocation, quadrant) {
    var tooltip = d3.select(selector + " .tooltip");

    var entryDateText = getDateTextOfEntry(entry, true);
    var entryStatusText = getStatusTextOfEntry(entry);
    var entryActivity = getActivityOfEntry(entry);
    var entryActivityText = activityTexts[entryActivity];

    tooltip.select(".tooltip-card").attr("class", "tooltip-card " + quadrant);
    tooltip.select(".date").text(entryDateText);
    tooltip.select(".status").text(entryStatusText);
    tooltip.select(".activity").text(entryActivityText);

    tooltip.style(
      "transform",
      "translate(" + domLocation.x + "px, " + domLocation.y + "px)"
    );

    tooltip.attr("class", "tooltip");
    tooltip.classed("active", true).classed(entryActivity, true);
  }

  function hideTooltip() {
    var tooltip = d3.select(selector + " .tooltip").classed("active", false);
  }

  function forceChartRedraw() {
    var chart = document.querySelector(selector + " .chart-svg");
    var oldDisplay = chart.style.display;
    chart.style.display = "none";
    chart.style.display = oldDisplay;
  }

  function buildLineContainerSelectorForYears(years) {
    var selectors = [];
    for (var i = 0; i < years.length; i++) {
      var year = years[i];

      selectors.push(".line-container" + year);
    }

    return selectors.join(",");
  }

  function throttle(interval, func) {
    var isThrottling;

    return function() {
      if (isThrottling) {
        return;
      }

      isThrottling = true;
      setTimeout(function() {
        isThrottling = false;
      }, interval);

      func.apply(this, arguments);
    };
  }

  function onLineMouseMove(d) {
    var mouse = d3.mouse(this);
    var mouseX = mouse[0];
    var mouseY = mouse[1];
    var line = d3.select(this);
    var year = Number(line.attr("year"));
    var yearIndex = getYearIndexOfYear(year);

    var date = getDateOfLocation(mouseX, mouseY, year);
    var closestEntry;
    if (line.classed("line-connector")) {
      closestEntry = findClosestEntryOfLineConnectorDate(date, line, yearIndex);
    } else {
      closestEntry = findClosestEntryToDate(date, yearIndex);
    }

    var location = getLocationOfEntry(closestEntry);
    var domLocation = getDomLocationFromChartCoordinates(location);
    var quadrant = getQuadrantOfLocation(location);

    showTooltip(closestEntry, domLocation, quadrant);
  }

  function onClickYearButton() {
    var button = d3.select(this);
    var buttons = d3.selectAll(selector + " .year-button");
    buttons.classed("selected", false);
    button.classed("selected", true);

    var year = Number(button.attr("year"));
    that.setActiveYear(year);
  }

  function validateOptions(options) {
    if (typeof options === "undefined") {
      throw new Error("No options object passed");
    }

    if (typeof options.data === "undefined") {
      throw new Error("No data passed with options");
    }

    if (typeof options.selector === "undefined") {
      throw new Error("No selector passed with options");
    }

    if (typeof options.thresholds === "undefined") {
      throw new Error("No thresholds passed with options");
    }

    if (typeof options.thresholds.heightened === "undefined") {
      throw new Error("No threshold for 'heightened' specified");
    }

    if (isNaN(options.thresholds.heightened)) {
      throw new Error("Threshold for 'heightened' has to be a number");
    }

    if (typeof options.thresholds.outbreak === "undefined") {
      throw new Error("No threshold for 'outbreak' specified");
    }

    if (isNaN(options.thresholds.outbreak)) {
      throw new Error("Threshold for 'outbreak' has to be a number");
    }
  }
}
