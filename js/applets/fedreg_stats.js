var fedreg = fedreg || {};
$(function(){
    fedreg.years = new Array();
    fedreg.rules = new Array();
    fedreg.today = new Date();
    fedreg.thisyear = fedreg.today.getFullYear();
    for(var year = 1996; year <= fedreg.thisyear; year++){
        var cache = false;
        if (year == fedreg.thisyear){
            cache = true;
        }
        fedreg.years.push({
            year: year,
            sigrules: null,
            ready: false,
            cache: cache,
        });
    }
    fedreg.all_rules = null;
    fedreg.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    fedreg.get_year_data = function(year){
        $.ajax("http://www.federalregister.gov/api/v1/documents.json", {
            data: {
                "fields[]": "type",
                "per_page": 2,
                "conditions[type]": "RULE",
                "conditions[significant]": 1,
                "conditions[publication_date][year]": year.year,
            },
            dataType: "jsonp",
            cache: year.cache,
            success: function(data){
                console.log("Finished " + year.year);
                year.sigrules = data['count'];
                year.ready = true;
                for (var i = 0; i < fedreg.years.length; i++){
                    if (!fedreg.years[i].ready){
                        return;
                    }
                }
                fedreg.update_chart();
            },
            error: function(){
                console.log("Retrying " + year.year);
                setTimeout(function(){
                    fedreg.get_year_data(year);
                }, 2000)
            }
        });
    }

    fedreg.update_chart = function(){
        var sigrules = [];
        for (var i = 0; i < fedreg.years.length; i++){
            sigrules.push(fedreg.years[i].sigrules);
        }
        var subtitle = 'Through ' + fedreg.months[fedreg.today.getMonth()] + ' ' + fedreg.today.getDate() + ', the federal government has finalized ' + fedreg.all_rules.toLocaleString() + ' final rules, ' + fedreg.years[fedreg.years.length - 1].sigrules + ' of which are deemed significant under Executive Order 12866.';
        fedreg.chart.series[0].setData(sigrules);
        fedreg.chart.update({
            subtitle: {text: subtitle},
            exporting: {enabled: true},
            yAxis: { visible: true },
        });
        fedreg.chart.hideLoading();
    };

    fedreg.init = function() {

        $.ajax("http://www.federalregister.gov/api/v1/documents.json", {
            data: {
                "fields[]": "type",
                "per_page": 2,
                "conditions[type]": "RULE",
                "conditions[publication_date][year]": fedreg.thisyear,
            },
            dataType: "jsonp",
            success: function(data){
                fedreg.all_rules = data['count'];
            }
        });
        var startvals = [];
        var years = [];
        for (var i = 0; i < fedreg.years.length; i++){
            startvals.push(0);
            years.push(fedreg.years[i].year)
            fedreg.get_year_data(fedreg.years[i]);
        }
        fedreg.chart = Highcharts.chart('sig_rules_chart', {
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
        fedreg.chart.showLoading()
    }

    $(fedreg.init);
});
