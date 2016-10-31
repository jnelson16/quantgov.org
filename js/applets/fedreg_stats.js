document.write('<figure id="fedreg_chart"><p>Loading...</p></figure>');
var fedreg = fedreg || {};

fedreg.years = new Array();
fedreg.rules = new Array();

fedreg.today = new Date();
fedreg.thisyear = fedreg.today.getFullYear();
fedreg.all_rules = null;
fedreg.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

fedreg.get_time_series = function(year){
    var next;
    if ( year < fedreg.thisyear){
        next = function(){fedreg.get_time_series(year + 1);}
    } else {
        next = function(){fedreg.update_chart(); }
    }
    $.ajax("http://www.federalregister.gov/api/v1/documents.json", {
        data: {
            "fields[]": "type",
            "per_page": 2,
            "conditions[type]": "RULE",
            "conditions[significant]": 1,
            "conditions[publication_date][year]": year,
        },
        dataType: "jsonp",
        success: function(data){
            fedreg.years.push(year);
            fedreg.rules.push(data['count']);
            next()
        }
    });
}

fedreg.update_chart = function(){
    var subtitle = 'Through ' + fedreg.months[fedreg.today.getMonth()] + ' ' + fedreg.today.getDate() + ', the federal government has finalized ' + fedreg.all_rules.toLocaleString() + ' final rules, ' + fedreg.rules[fedreg.rules.length - 1] + ' of which are deemed significant under Executive Order 12866.';
    Highcharts.chart('fedreg_chart', {
        chart: {type: 'column'},
        legend: {enabled: false},
        title: {text: 'Significant Final Rules'},
        subtitle: {text: subtitle},
        xAxis: {categories: fedreg.years},
        yAxis: {title:{enabled: false}},
        series: [{name: 'Significant Final Rules', data: fedreg.rules}],
        credit: {href: 'http://federalregister.gov', text: "Source: Federal Register API"}

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
            fedreg.get_time_series(1996);
        }
    });
}

$(fedreg.init);
