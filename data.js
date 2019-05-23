function getData() {
  var years = [];
  var currentYearEntries = [];
  var currentYear = data[0].year;
  var minValue = Number.MAX_VALUE;
  var maxValue = Number.MIN_VALUE;

  for (var i = 0; i < data.length; i++) {
    var weekEntry = data[i];
    var weekDates = getWeekDates(weekEntry);
    if (!weekDates) {
      continue;
    }

    minValue = Math.min(minValue, weekEntry.pctOfTotal);
    maxValue = Math.max(maxValue, weekEntry.pctOfTotal);

    if (weekEntry.year !== currentYear) {
      years.push({
        year: currentYear,
        entries: currentYearEntries
      });

      currentYearEntries = [];
    }

    currentYear = weekEntry.year;

    currentYearEntries.push({
      startDate: weekDates.startDate,
      midDate: weekDates.midDate,
      endDate: weekDates.endDate,
      value: weekEntry.pctOfTotal
    });
  }

  years.push({
    year: currentYear,
    entries: currentYearEntries
  });

  return {
    minValue: minValue,
    maxValue: maxValue,
    years: years
  };
}

function getWeekDates(weekEntry) {
  var dateParts = weekEntry.week.split(" to ");
  if (dateParts.length !== 2) {
    return;
  }

  var startDatePart = dateParts[0].trim();
  var endDatePart = dateParts[1].trim();
  var startDate = new Date(startDatePart + " " + weekEntry.year);
  if (isNaN(startDate)) {
    return;
  }

  var endDate;
  if (isNaN(Number(endDatePart[0]))) {
    endDate = new Date(endDatePart + " " + weekEntry.year);
  } else {
    var startMonth = startDatePart.split(" ")[0];
    endDate = new Date(startMonth + " " + endDatePart + " " + weekEntry.year);
  }

  if (isNaN(endDate)) {
    return;
  }

  if (startDate.getMonth() > endDate.getMonth()) {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  return {
    startDate: startDate,
    endDate: endDate,
    midDate: new Date((startDate.getTime() + endDate.getTime()) / 2)
  };
}

var data = [
  {
    week: "Jan 7 to 13",
    year: 2018,
    numDiagnosed: 2836,
    pctOfTotal: 1.99,
    total: 142202
  },
  {
    week: "Jan 14 to 20",
    year: 2018,
    numDiagnosed: 3027,
    pctOfTotal: 2.21,
    total: 136736
  },
  {
    week: "jan 21 to 27",
    year: 2018,
    numDiagnosed: 3045,
    pctOfTotal: 2.19,
    total: 139106
  },
  {
    week: "Jan 28 to Feb 3",
    year: 2018,
    numDiagnosed: 2940,
    pctOfTotal: 2.12,
    total: 138578
  },
  {
    week: "Feb 4 to Feb 10",
    year: 2018,
    numDiagnosed: 3012,
    pctOfTotal: 2.08,
    total: 144493
  },
  {
    week: "Feb 11 to Feb 17",
    year: 2018,
    numDiagnosed: 2906,
    pctOfTotal: 2.01,
    total: 144433
  },
  {
    week: "Feb 18 to Feb 24",
    year: 2018,
    numDiagnosed: 2700,
    pctOfTotal: 1.9,
    total: 141833
  },
  {
    week: "Feb 25 to March 3",
    year: 2018,
    numDiagnosed: 2167,
    pctOfTotal: 1.55,
    total: 139566
  },
  {
    week: "March 4 to 10",
    year: 2018,
    numDiagnosed: 1772,
    pctOfTotal: 1.27,
    total: 139251
  },
  {
    week: "March 11 to 17",
    year: 2018,
    numDiagnosed: 1613,
    pctOfTotal: 1.15,
    total: 140083
  },
  {
    week: "March 18 to 24",
    year: 2018,
    numDiagnosed: 1560,
    pctOfTotal: 1.11,
    total: 140429
  },
  {
    week: "March 25 to 31",
    year: 2018,
    numDiagnosed: 1511,
    pctOfTotal: 1.09,
    total: 138145
  },
  {
    week: "April 1 to 7",
    year: 2018,
    numDiagnosed: 1506,
    pctOfTotal: 1.08,
    total: 139853
  },
  {
    week: "April 8 to 14",
    year: 2018,
    numDiagnosed: 1372,
    pctOfTotal: 0.96,
    total: 143036
  },
  {
    week: "April 14 to 21",
    year: 2018,
    numDiagnosed: 1305,
    pctOfTotal: 0.91,
    total: 144189
  },
  {
    week: "April 22 to 28",
    year: 2018,
    numDiagnosed: 1242,
    pctOfTotal: 0.87,
    total: 142447
  },
  {
    week: "April 29 to May 5",
    year: 2018,
    numDiagnosed: 1280,
    pctOfTotal: 0.88,
    total: 144812
  },
  {
    week: "May 6 to May 12",
    year: 2018,
    numDiagnosed: 1285,
    pctOfTotal: 0.87,
    total: 148229
  },
  {
    week: "May 13 to 19",
    year: 2018,
    numDiagnosed: 1240,
    pctOfTotal: 0.83,
    total: 149640
  },
  {
    week: "May 20 to 26",
    year: 2018,
    numDiagnosed: 1159,
    pctOfTotal: 0.78,
    total: 149015
  },
  {
    week: "May 27 to June 2",
    year: 2018,
    numDiagnosed: 1162,
    pctOfTotal: 0.79,
    total: 146988
  },
  {
    week: "June 3 to June 9",
    year: 2018,
    numDiagnosed: 1206,
    pctOfTotal: 0.81,
    total: 149580
  },
  {
    week: "June 10 to 16",
    year: 2018,
    numDiagnosed: 1234,
    pctOfTotal: 0.83,
    total: 149039
  },
  {
    week: "June 17 to 23",
    year: 2018,
    numDiagnosed: 1231,
    pctOfTotal: 0.82,
    total: 150428
  },
  {
    week: "June 24 to 30",
    year: 2018,
    numDiagnosed: 1171,
    pctOfTotal: 0.79,
    total: 148669
  },
  {
    week: "July 1 to 7",
    year: 2018,
    numDiagnosed: 1199,
    pctOfTotal: 0.8,
    total: 149623
  },
  {
    week: "July 8 to 14",
    year: 2018,
    numDiagnosed: 1179,
    pctOfTotal: 0.79,
    total: 150003
  },
  {
    week: "July 15 to 21",
    year: 2018,
    numDiagnosed: 1139,
    pctOfTotal: 0.76,
    total: 149419
  },
  {
    week: "July 22 to 28",
    year: 2018,
    numDiagnosed: 1093,
    pctOfTotal: 0.74,
    total: 148044
  },
  {
    week: "July 29 to Aug 4",
    year: 2018,
    numDiagnosed: 1105,
    pctOfTotal: 0.75,
    total: 146573
  },
  {
    week: "Aug 5 to Aug 11",
    year: 2018,
    numDiagnosed: 1170,
    pctOfTotal: 0.78,
    total: 150752
  },
  {
    week: "Aug 12 to 18",
    year: 2018,
    numDiagnosed: 1174,
    pctOfTotal: 0.8,
    total: 146507
  },
  {
    week: "Aug 19 to 25",
    year: 2018,
    numDiagnosed: 1190,
    pctOfTotal: 0.8,
    total: 148428
  },
  {
    week: "August 26 to Sept 1",
    year: 2018,
    numDiagnosed: 1175,
    pctOfTotal: 0.78,
    total: 150193
  },
  {
    week: "Sept 2 to Sept 8",
    year: 2018,
    numDiagnosed: 1159,
    pctOfTotal: 0.77,
    total: 150107
  },
  {
    week: "Sept 9 to 15",
    year: 2018,
    numDiagnosed: 1252,
    pctOfTotal: 0.84,
    total: 149063
  },
  {
    week: "Sept 16 to 22",
    year: 2018,
    numDiagnosed: 1250,
    pctOfTotal: 0.82,
    total: 151871
  },
  {
    week: "Sept 23 to 29",
    year: 2018,
    numDiagnosed: 1221,
    pctOfTotal: 0.83,
    total: 147251
  },
  {
    week: "Sept 30 to Oct 6",
    year: 2018,
    numDiagnosed: 1260,
    pctOfTotal: 0.84,
    total: 150239
  },
  {
    week: "Oct 7 to 13",
    year: 2018,
    numDiagnosed: 1146,
    pctOfTotal: 0.77,
    total: 147978
  },
  {
    week: "Oct 14 to 20",
    year: 2018,
    numDiagnosed: 1270,
    pctOfTotal: 0.87,
    total: 145583
  },
  {
    week: "Oct 21 to 27",
    year: 2018,
    numDiagnosed: 1277,
    pctOfTotal: 0.88,
    total: 144935
  },
  {
    week: "Oct 28 to Nov 3",
    year: 2018,
    numDiagnosed: 1294,
    pctOfTotal: 0.89,
    total: 145828
  },
  {
    week: "Nov 4 to 10",
    year: 2018,
    numDiagnosed: 1400,
    pctOfTotal: 0.95,
    total: 147042
  },
  {
    week: "Nov 11 to 17",
    year: 2018,
    numDiagnosed: 1273,
    pctOfTotal: 0.89,
    total: 143495
  },
  {
    week: "Nov 18 to 24",
    year: 2018,
    numDiagnosed: 1245,
    pctOfTotal: 0.91,
    total: 136485
  },
  {
    week: "Nov 25 to Dec 1",
    year: 2018,
    numDiagnosed: 1344,
    pctOfTotal: 0.93,
    total: 143804
  },
  {
    week: "Dec 2 to 8",
    year: 2018,
    numDiagnosed: 1368,
    pctOfTotal: 0.97,
    total: 141595
  },
  {
    week: "Dec 9 to 15",
    year: 2018,
    numDiagnosed: 1531,
    pctOfTotal: 1.05,
    total: 145198
  },
  {
    week: "Dec 16 to 22",
    year: 2018,
    numDiagnosed: 1656,
    pctOfTotal: 1.13,
    total: 146851
  },
  {
    week: "December 23 to 29",
    year: 2018,
    numDiagnosed: 1794,
    pctOfTotal: 1.29,
    total: 139319
  },
  {
    week: "Dec 30 to Jan 5",
    year: 2019,
    numDiagnosed: 1720,
    pctOfTotal: 1.18,
    total: 145667
  },
  {
    week: "Jan 6 to 12",
    year: 2019,
    numDiagnosed: 1621,
    pctOfTotal: 1.12,
    total: 144097
  },
  {
    week: "Jan 13 to 19",
    year: 2019,
    numDiagnosed: 1541,
    pctOfTotal: 1.09,
    total: 141407
  },
  {
    week: "Jan 20 to 26",
    year: 2019,
    numDiagnosed: 1584,
    pctOfTotal: 1.11,
    total: 142344
  },
  {
    week: "Jan 27 to Feb 2",
    year: 2019,
    numDiagnosed: 1759,
    pctOfTotal: 1.22,
    total: 143614
  },
  {
    week: "Feb 3 to Feb 9",
    year: 2019,
    numDiagnosed: 2029,
    pctOfTotal: 1.34,
    total: 151364
  },
  {
    week: "Feb 10 to 16",
    year: 2019,
    numDiagnosed: 1994,
    pctOfTotal: 1.33,
    total: 149972
  },
  {
    week: "Feb 17 to 23",
    year: 2019,
    numDiagnosed: 2010,
    pctOfTotal: 1.36,
    total: 147662
  },
  {
    week: "Feb 24 to March 2",
    year: 2019,
    numDiagnosed: 1874,
    pctOfTotal: 1.25,
    total: 149951
  },
  {
    week: "March 3 to 9",
    year: 2019,
    numDiagnosed: 1933,
    pctOfTotal: 1.28,
    total: 151327
  },
  {
    week: "March 10 to 16",
    year: 2019,
    numDiagnosed: 1953,
    pctOfTotal: 1.28,
    total: 152131
  },
  {
    week: "March 17 to 23",
    year: 2019,
    numDiagnosed: 1771,
    pctOfTotal: 1.18,
    total: 150579
  },
  {
    week: "March 24 to 30",
    year: 2019,
    numDiagnosed: 1614,
    pctOfTotal: 1.11,
    total: 145346
  },
  {
    week: "10th",
    year: undefined,
    numDiagnosed: 1159,
    pctOfTotal: 0.78,
    total: 139251
  },
  {
    week: "25th",
    year: undefined,
    numDiagnosed: 1194.5,
    pctOfTotal: 0.8,
    total: 142017.5
  },
  {
    week: "Mean",
    year: undefined,
    numDiagnosed: 1542,
    pctOfTotal: 1.07,
    total: 145234.6275
  },
  {
    week: "75th",
    year: undefined,
    numDiagnosed: 1545.5,
    pctOfTotal: 1.09,
    total: 149027
  },
  {
    week: "90th",
    year: undefined,
    numDiagnosed: 2836,
    pctOfTotal: 2.0,
    total: 150107
  }
];
