var cra_tracker = cra_tracker || {}
$(function(){
    cra_tracker.start_date = "2016-05-27";
     

    cra_tracker.init_chart = function(){
        cra_tracker.dates = [];
        cra_tracker.data = [];
        var startdata = [];
        var now = Date.now()
        for (var date = new Date(Date.parse(cra_tracker.start_date)); date.getTime() <= now; date.setDate(date.getDate() + 1)){
            cra_tracker.dates.push(date.getTime());
            startdata.push(0);
            cra_tracker.data.push(0);
        }
        var today = new Date();
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        cra_tracker.chart = Highcharts.chart('cra_chart', {
            xAxis: {type: 'datetime'},
            title: {text: 'Significant Rules Subject to the CRA'},
            subtitle: {text: 'as of ' + today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear()},
            series: [{
                type: 'column',
                data: startdata,
                name: "Significant Rules Published Subject to the CRA",
                pointStart: Date.parse(cra_tracker.start_date),
                pointInterval: 24 * 60 * 60 * 1000,
            }],
            exporting: {
                enabled: false,
                filename: 'quantgov_cra_tracker_' + today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() + 1)).slice(-2),
            },
            yAxis: {
                visible: false,
                title: {enabled: false},
            },
            legend: {enabled: false},
            credits: {
                text: "Source: Federal Register. Produced by QuantGov.",
                href: "http://quantgov.org"
            },
        })
        cra_tracker.chart.showLoading();
    }

    cra_tracker.update_chart = function(){
        cra_tracker.chart.series[0].setData(cra_tracker.data);
        cra_tracker.chart.update({
            exporting: {enabled: true},
            yAxis: { visible: true, },
        })
        cra_tracker.chart.hideLoading();
    }

    cra_tracker.get_rules = function(){
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
            data: {
                'fields[]': ['publication_date', 'title', 'html_url', 'agency_names', 'topics'],
                'per_page': 1000,
                'conditions[significant]': 1,
                'conditions[type]': 'RULE',
                'conditions[publication_date][gte]': cra_tracker.start_date,
                'conditions[publication_date][lte]': '2017-01-20',
            },
            dataType: 'jsonp',
            success: function(data){
                var do_chart = cra_tracker.chart !== undefined;
                var do_table = $("#cra_table").length !== 0;
                var rows = [];
                for (var i = 0; i < data.results.length; i++){
                    var reg = data.results[i];
                    if (do_chart){
                        cra_tracker.data[cra_tracker.dates.indexOf(Date.parse(reg.publication_date))] += 1;
                    }
                    if (do_table){
                        rows.push([reg.publication_date, '<a href="' + reg.html_url + '" target="_blank">' + reg.title + '</a>', reg.agency_names.join(', '), reg.topics.join(', ')]);
                    }
                }
                if (do_chart){
                    cra_tracker.update_chart();
                }
                if (do_table){
                    cra_tracker.table = $('#cra_table').DataTable({
                        data: rows,
                        columns: [
                            {title: 'Date'},
                            {title: 'Rule'},
                            {title: 'Agencies'},
                            {title: 'Topics'},
                        ]
                    });
                }
            },
            error: function(problem){
                console.log(problem);
            }
        });
    }

    cra_tracker.init = function(){
        var chart_container = $("#cra_chart");
        if (chart_container.length !== 0){
            cra_tracker.init_chart()
        }
        cra_tracker.get_rules();
    }
    cra_tracker.init();
});
