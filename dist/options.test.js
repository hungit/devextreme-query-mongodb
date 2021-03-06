'use strict';

var chai = require('chai');
var expect = chai.expect;
var qs = require('qs');

var options = require('./options');
var getOptions = options.getOptions;
var fixFilterAndSearch = options.private.fixFilterAndSearch;

function testOptions(queryString, expectedResult, schema) {
  var result = getOptions(qs.parse(queryString), schema);


  expect(result).to.eql(expectedResult);
}

suite('fixFilterAndSearch', function () {
  test('fixes filter int', function () {
    expect(fixFilterAndSearch({
      int: 'int'
    })({
      filter: [['int', '=', '34']]
    })).to.eql({
      filter: [['int', '=', 34]]
    });
  });

  test('fixes search int', function () {
    expect(fixFilterAndSearch({
      int: 'int'
    })({
      searchExpr: 'int',
      searchOperation: '=',
      searchValue: '34'
    })).to.eql({
      searchExpr: 'int',
      searchOperation: '=',
      searchValue: 34
    });
  });
});

suite('getOptions', function () {
  test('take and total count', function () {
    testOptions('take=10&requireTotalCount=true', {
      errors: [],
      loadOptions: {
        take: 10,
        requireTotalCount: true
      },
      processingOptions: {}
    });
  });

  test('take and total count with tzOffset', function () {
    testOptions('take=10&requireTotalCount=true&tzOffset=-60', {
      errors: [],
      loadOptions: {
        take: 10,
        requireTotalCount: true
      },
      processingOptions: {
        timezoneOffset: -60
      }
    });
  });

  test('take, skip, total count', function () {
    testOptions('take=10&requireTotalCount=true&skip=30', {
      errors: [],
      loadOptions: {
        take: 10,
        skip: 30,
        requireTotalCount: true
      },
      processingOptions: {}
    });
  });

  test('sort, take and total count', function () {
    testOptions('sort%5B0%5D%5Bselector%5D=date2&sort%5B0%5D%5Bdesc%5D=false&take=10&requireTotalCount=true', {
      errors: [],
      loadOptions: {
        sort: [{
          selector: 'date2',
          desc: false
        }],
        take: 10,
        requireTotalCount: true
      },
      processingOptions: {}
    });
  });

  test('issue #10 - filter works when given as array', function () {
    expect(getOptions({
      filter: [['dtFinished', '>=', '2018-08-01T16:20:30.000Z'], 'and', ['dtFinished', '<', '2018-08-01T16:20:30.000Z']]
    })).to.eql({
      errors: [],
      loadOptions: {
        filter: [['dtFinished', '>=', new Date('2018-08-01T16:20:30.000Z')], 'and', ['dtFinished', '<', new Date('2018-08-01T16:20:30.000Z')]]
      },
      processingOptions: {}
    });
  });

  test('issue #10 - filter works when given as string', function () {
    expect(getOptions({
      filter: '[["dtFinished",">=","2018-08-01T16:20:30.000Z"],"and",["dtFinished","<","2018-08-01T16:20:30.000Z"]]'
    })).to.eql({
      errors: [],
      loadOptions: {
        filter: [['dtFinished', '>=', new Date('2018-08-01T16:20:30.000Z')], 'and', ['dtFinished', '<', new Date('2018-08-01T16:20:30.000Z')]]
      },
      processingOptions: {}
    });
  });

  test('total count, group, group count', function () {
    testOptions('sort%5B0%5D%5Bselector%5D=date2&sort%5B0%5D%5Bdesc%5D=false&requireTotalCount=true&group%5B0%5D%5Bselector%5D=date2&group%5B0%5D%5BisExpanded%5D=false&requireGroupCount=true', {
      errors: [],
      loadOptions: {
        sort: [{
          selector: 'date2',
          desc: false
        }],
        requireTotalCount: true,
        group: [{
          selector: 'date2',
          isExpanded: false
        }],
        requireGroupCount: true
      },
      processingOptions: {}
    });
  });

  test('sort, filter with date', function () {
    testOptions('sort%5B0%5D%5Bselector%5D=date2&sort%5B0%5D%5Bdesc%5D=false&filter%5B0%5D%5B0%5D=date2&filter%5B0%5D%5B1%5D=%3D&filter%5B0%5D%5B2%5D=2017-07-13T00%3A00%3A00.000Z', {
      errors: [],
      loadOptions: {
        sort: [{
          selector: 'date2',
          desc: false
        }],
        filter: [['date2', '=', new Date(Date.parse('2017-07-13'))]]
      },
      processingOptions: {}
    });
  });

  test('take, total count, filter with int', function () {
    testOptions('take=10&requireTotalCount=true&filter%5B0%5D%5B0%5D=int1&filter%5B0%5D%5B1%5D=%3D&filter%5B0%5D%5B2%5D=4', {
      errors: [],
      loadOptions: {
        take: 10,
        requireTotalCount: true,
        filter: [['int1', '=', 4]]
      },
      processingOptions: {}
    }, {
      int1: 'int'
    });
  });

  test('summaryQueryLimit, skip, take, requireTotalCount, totalSummary, tzOffset', function () {
    testOptions('summaryQueryLimit=500&skip=0&take=20&requireTotalCount=true&totalSummary=%5B%7B%22selector%22%3A%22date1%22%2C%22summaryType%22%3A%22max%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22avg%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22sum%22%7D%5D&tzOffset=-60', {
      errors: [],
      loadOptions: {
        skip: 0,
        take: 20,
        requireTotalCount: true,
        totalSummary: [{
          selector: 'date1',
          summaryType: 'max'
        }, {
          selector: 'int1',
          summaryType: 'avg'
        }, {
          selector: 'int1',
          summaryType: 'sum'
        }]
      },
      processingOptions: {
        timezoneOffset: -60,
        summaryQueryLimit: 500
      }
    });
  });

  test('summaryQueryLimit, skip, take, requireTotalCount, totalSummary, group, requireGroupCount, groupSummary, tzOffset', function () {
    testOptions('summaryQueryLimit=500&skip=0&take=20&requireTotalCount=true&totalSummary=%5B%7B%22selector%22%3A%22date1%22%2C%22summaryType%22%3A%22max%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22avg%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22sum%22%7D%5D&group=%5B%7B%22selector%22%3A%22int1%22%2C%22desc%22%3Afalse%2C%22isExpanded%22%3Afalse%7D%5D&requireGroupCount=true&groupSummary=%5B%7B%22selector%22%3A%22date1%22%2C%22summaryType%22%3A%22min%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22avg%22%7D%2C%7B%22selector%22%3A%22int1%22%2C%22summaryType%22%3A%22sum%22%7D%2C%7B%22summaryType%22%3A%22count%22%7D%5D&tzOffset=-60', {
      errors: [],
      loadOptions: {
        skip: 0,
        take: 20,
        requireTotalCount: true,
        totalSummary: [{
          selector: 'date1',
          summaryType: 'max'
        }, {
          selector: 'int1',
          summaryType: 'avg'
        }, {
          selector: 'int1',
          summaryType: 'sum'
        }],
        requireGroupCount: true,
        group: [{
          selector: 'int1',
          desc: false,
          isExpanded: false
        }],
        groupSummary: [{
          selector: 'date1',
          summaryType: 'min'
        }, {
          selector: 'int1',
          summaryType: 'avg'
        }, {
          selector: 'int1',
          summaryType: 'sum'
        }, {
          summaryType: 'count'
        }]
      },
      processingOptions: {
        timezoneOffset: -60,
        summaryQueryLimit: 500
      }
    });
  });
});