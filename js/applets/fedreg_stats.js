var sigrules = sigrules || {};
$(function(){
    sigrules.years = new Array();
    sigrules.rules = new Array();
    sigrules.today = new Date();
    sigrules.thisyear = sigrules.today.getFullYear();
    var preloaded = {
        1996: 307,
        1997: 268,
        1998: 242,
        1999: 231,
        2000: 290,
        2001: 297,
        2002: 284,
        2003: 337,
        2004: 321,
        2005: 259,
        2006: 163,
        2007: 180,
        2008: 426,
        2009: 371,
        2010: 424,
        2011: 425,
        2012: 357,
        2013: 332,
        2014: 307,
        2015: 302,
    };
    for(var year = 1996; year <= sigrules.thisyear; year++){
        var year_sigrules = null;
        var ready = false;
        if (year in preloaded){
            year_sigrules = preloaded[year];
            ready = true;
        }
        sigrules.years.push({
            year: year,
            sigrules: year_sigrules,
            ready: ready,
        });
    }
    sigrules.all_rules = null;
    sigrules.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    sigrules.get_year_data = function(year){
        if (year.ready){
            return;
        }
        $.ajax("http://www.federalregister.gov/api/v1/documents.json", {
            data: {
                "fields[]": "type",
                "per_page": 2,
                "conditions[type]": "RULE",
                "conditions[significant]": 1,
                "conditions[publication_date][year]": year.year,
            },
            dataType: "jsonp",
            success: function(data){
                console.log("Finished " + year.year);
                year.sigrules = data['count'];
                year.ready = true;
                for (var i = 0; i < sigrules.years.length; i++){
                    if (!sigrules.years[i].ready){
                        return;
                    }
                }
                sigrules.update_chart();
            },
            error: function(){
                console.log("Retrying " + year.year);
                setTimeout(function(){
                    sigrules.get_year_data(year);
                }, 2000)
            }
        });
    }

    sigrules.update_chart = function(){
        var series = [];
        for (var i = 0; i < sigrules.years.length; i++){
            series.push(sigrules.years[i].sigrules);
        }
        var subtitle = 'Through ' + sigrules.months[sigrules.today.getMonth()] + ' ' + sigrules.today.getDate() + ', the federal government has finalized ' + sigrules.all_rules.toLocaleString() + ' final rules, ' + sigrules.years[sigrules.years.length - 1].sigrules + ' of which are deemed significant under Executive Order 12866.';
        sigrules.chart.series[0].setData(series);
        sigrules.chart.update({
            subtitle: {text: subtitle},
            exporting: {enabled: true},
            yAxis: { visible: true },
        });
        sigrules.chart.hideLoading();
    };

    sigrules.init = function() {

        $.ajax("http://www.federalregister.gov/api/v1/documents.json", {
            data: {
                "fields[]": "type",
                "per_page": 2,
                "conditions[type]": "RULE",
                "conditions[publication_date][year]": sigrules.thisyear,
            },
            dataType: "jsonp",
            success: function(data){
                sigrules.all_rules = data['count'];
            }
        });
        var startvals = [];
        var years = [];
        for (var i = 0; i < sigrules.years.length; i++){
            startvals.push(0);
            years.push(sigrules.years[i].year)
            sigrules.get_year_data(sigrules.years[i]);
        }
        sigrules.chart = Highcharts.chart('sig_rules_chart', {
            chart: {type: 'column'},
            legend: {enabled: false},
            title: {text: 'Significant Final Rules'},
            xAxis: {categories: years},
            yAxis: {
                title:{enabled: false},
                visible: false,
            },
            series: [{name: 'Significant Final Rules', data: startvals}],
            credits: {href: 'http://federalregister.gov', text: "Source: Federal Register. Produced by QuantGov."},
            exporting: {enabled: false},
        })
        sigrules.chart.showLoading()
    }

    $(sigrules.init);
});
