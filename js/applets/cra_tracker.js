var cra_tracker = cra_tracker || {}
$(function(){
    cra_tracker.start_date = "2016-06-07";
    cra_tracker.enddates = [
        {
            end: "January 3", 
            start: "2016-06-13",
        },
        {
            end: "December 16", 
            start: "2016-06-07",
        },
        {
            end: "December 15", 
            start: "2016-06-03",
        },
        {
            end: "December 14", 
            start: "2016-05-31",
        },
        {
            end: "December 13", 
            start: "2016-05-27",
        },
        {
            end: "December 12", 
            start: "2016-05-26",
        },
        {
            end: "December 11", 
            start: "2016-05-26",
        },
        {
            end: "December 10", 
            start: "2016-05-26",
        },
        {
            end: "December 9", 
            start: "2016-05-26",
        },
    ];
    cra_tracker.rows = [];
     

    cra_tracker.parse_date = function(datestr){
        var bits = datestr.split('-');
        return new Date(parseInt(bits[0]), parseInt(bits[1]) - 1, parseInt(bits[2]));
    }

    cra_tracker.init_chart = function(){
        cra_tracker.dates = [];
        cra_tracker.data = [];
        var startdata = [];
        var now = Date.now();
        var date = cra_tracker.parse_date(cra_tracker.start_date);
        while (date.getTime() < now){
            cra_tracker.dates.push('' + date.getFullYear() + "-"  + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2));
            startdata.push(0);
            cra_tracker.data.push(0);
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
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
                pointStart: cra_tracker.parse_date(cra_tracker.start_date).getTime(),
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
        cra_tracker.get_sig_rules();
    }

    cra_tracker.update_chart = function(){
        cra_tracker.chart.series[0].setData(cra_tracker.data);
        cra_tracker.chart.update({
            exporting: {enabled: true},
            yAxis: { visible: true, },
        })
        cra_tracker.chart.hideLoading();
    }

    cra_tracker.get_sig_rules = function(){
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
            data: {
                'fields[]': ['publication_date'],
                'per_page': 1000,
                'conditions[significant]': 1,
                'conditions[type]': 'RULE',
                'conditions[publication_date][gte]': cra_tracker.start_date,
                'conditions[publication_date][lte]': '2017-01-20',
            },
            dataType: 'jsonp',
            success: function(data){
                var do_chart = cra_tracker.chart !== undefined;
                for (var i = 0; i < data.results.length; i++){
                    var reg = data.results[i];
                    cra_tracker.data[cra_tracker.dates.indexOf(reg.publication_date)] += 1;
                }
                cra_tracker.update_chart();
            },
            error: function(problem){
                console.log(problem);
            }
        });
    }

    cra_tracker.get_rules = function(page){
        if (page === undefined){
            page = 1
        }
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
            data: {
                'fields[]': ['publication_date', 'title', 'html_url', 'agency_names', 'topics'],
                'per_page': 100,
                'page': page,
                'conditions[type]': 'RULE',
                'conditions[significant]': 1,
                'conditions[publication_date][gte]': cra_tracker.start_date,
                'conditions[publication_date][lte]': '2017-01-20',
            },
            dataType: 'jsonp',
            success: function(data){
                var rows = [];
                for (var i = 0; i < data.results.length; i++){
                    var reg = data.results[i];
                    rows.push([reg.publication_date, '<a href="' + reg.html_url + '" target="_blank">' + reg.title + '</a>', reg.agency_names.join(', '), reg.topics.join(', ')]);
                }
                if (data.total_pages != page){
                    cra_tracker.get_rules(page + 1);
                } 
                if (cra_tracker.table === undefined){
                    cra_tracker.table = $('#cra_table').DataTable({
                        data: rows,
                        columns: [
                            {title: 'Date'},
                            {title: 'Rule'},
                            {title: 'Agencies'},
                            {title: 'Topics'},
                        ]
                    });
                } else {
                    for (var i = 0; i < rows.length; i++){
                        cra_tracker.table.row.add(rows[i]).draw();
                    }
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
            cra_tracker.init_chart();
        }
        if ($("#cra_table_container").length !== 0){
            if ($("#cra_date_select").length === 0){
                select_p = $('<p></p>').text("Choose an adjournment date to update the list: ");
                var selector = $('<select id="cra_date_select" style="display: inline; width: auto;"></select>');
                for (var i=0; i < cra_tracker.enddates.length; i++){
                    var enddate = cra_tracker.enddates[i];
                    selector.append('<option value="' + enddate.start  + '">'+ enddate.end + '</option>');
                }
                selector.change(function(){
                    cra_tracker.start_date = $('#cra_date_select option:selected').first().attr('value');
                    cra_tracker.init();
                });
                $("#cra_table_container").append(select_p.append(selector));
                $("#cra_table_container").append('<table id="cra_table"></table>');

            }
            if (cra_tracker.table !== undefined){
                cra_tracker.table.clear()
            };
            cra_tracker.get_rules();
        }
    }
    cra_tracker.init();
});
