var fedreg = fedreg || {};
$(function(){
    fedreg.years = new Array();
    fedreg.rules = new Array();
    fedreg.today = new Date();
    fedreg.thisyear = fedreg.today.getFullYear();
    for(var year = 1996; year <= fedreg.thisyear; year++){
        fedreg.years.push({
            year: year,
            sigrules: null,
            ready: false,
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
            }
        });
    }

    fedreg.update_chart = function(){
        var years = [];
        var sigrules = [];
        for (var i = 0; i < fedreg.years.length; i++){
            years.push(fedreg.years[i].year);
            sigrules.push(fedreg.years[i].sigrules);
        }
        var subtitle = 'Through ' + fedreg.months[fedreg.today.getMonth()] + ' ' + fedreg.today.getDate() + ', the federal government has finalized ' + fedreg.all_rules.toLocaleString() + ' final rules, ' + fedreg.years[fedreg.years.length - 1].sigrules + ' of which are deemed significant under Executive Order 12866.';
        Highcharts.chart('sig_rules_chart', {
            chart: {type: 'column'},
            legend: {enabled: false},
            title: {text: 'Significant Final Rules'},
            subtitle: {text: subtitle},
            xAxis: {categories: years},
            yAxis: {title:{enabled: false}},
            series: [{name: 'Significant Final Rules', data: sigrules}],
            credits: {href: 'http://federalregister.gov', text: "Source: Federal Register. Produced by QuantGov."}

        })
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
        for (var i = 0; i < fedreg.years.length; i++){
            fedreg.get_year_data(fedreg.years[i]);
        }
    }

    $(fedreg.init);
});
