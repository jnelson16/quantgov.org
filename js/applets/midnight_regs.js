var midnight_reg_tracker = {};
$(function(){
    midnight_reg_tracker.presidents = [{
        name: 'Bill Clinton',
        sig: 112,
        nonsig: 857,
    }, {
        name: 'George W. Bush',
        sig: 171,
        nonsig: 854,
    }, {
        name: 'Barack Obama',
        year: 2016,
        election_day: 8,
        sig: null,
        nonsig: null,
    }];

    midnight_reg_tracker.get_rule_counts = function(president, significance){
        var significant = 0;
        if (significance === 'sig'){
            significant = 1;
        }
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
                data: {
                    'fields[]': 'type',
                    'per_page': 2,
                    'conditions[type]': 'RULE',
                    'conditions[significant]': significant,
                    'conditions[publication_date][gte]': president.year + '-11-0' + (president.election_day + 1),
                    'conditions[publication_date][lte]': (president.year + 1) + '-01-20'
                },
                dataType: 'jsonp',
                success: function (data){
                    console.log("Finished with " + significance);
                    president[significance] = data['count'];
                    if (president['sig'] === null || president['nonsig'] === null){
                        return;
                    }
                    midnight_reg_tracker.display();
                }
                });

    }

    midnight_reg_tracker.display = function(){
        var sig = [];
        var nonsig = [];
        for (var i = 0; i < midnight_reg_tracker.presidents.length; i++){
            sig.push(midnight_reg_tracker.presidents[i].sig);
            nonsig.push(midnight_reg_tracker.presidents[i].nonsig);
        }

        midnight_reg_tracker.chart.series[0].setData(nonsig);
        midnight_reg_tracker.chart.series[1].setData(sig);
        midnight_reg_tracker.chart.update({
            exporting: {enabled: true},
            yAxis: { visible: true },
        });
        midnight_reg_tracker.chart.hideLoading();


    };

    midnight_reg_tracker.fill_table = function(president){
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
                data: {
                    'fields[]': ['publication_date', 'title', 'html_url', 'agency_names', 'topics'],
                    'per_page': 10,
                    'conditions[significant]': 1,
                    'conditions[type]': 'RULE',
                    'conditions[publication_date][gte]': president.year + '-11-0' + (president.election_day + 1),
                    'conditions[publication_date][lte]': (president.year + 1) + '-01-20'
                },
                dataType: 'jsonp',
                success: function(data){
                    var rows = [];
                    for (var i = 0; i < data.results.length; i++){
                        var reg = data.results[i];
                        rows.push([reg.publication_date, '<a href="' + reg.html_url + '" target="_blank">' + reg.title + '</a>', reg.agency_names.join(', '), reg.topics.join(', ')])
                    }
                midnight_reg_tracker.table = $('#midnight_regs_table').DataTable({
                    data: rows,
                    columns: [
                        {title: 'Date'},
                        {title: 'Rule'},
                        {title: 'Agencies'},
                        {title: 'Topics'},
                    ]
                });
                },
                error: function(problem){
                    console.log(problem);
                }
                });
    };


    var container = $('#midnight_regs_container');
    if (container.length !== 0){
        container.append('<div id="midnight_regs_chart"></div><table id="midnight_regs_table"></table>');
    }

    var table = $('#midnight_regs_table');
    if (!table.length !== 0){
        midnight_reg_tracker.fill_table(midnight_reg_tracker.presidents[midnight_reg_tracker.presidents.length - 1]);
    }
    var chart = $('#midnight_regs_chart');
    if (!table.length !== 0){
        var categories = [];
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var today = new Date();
        for (var i = 0; i < midnight_reg_tracker.presidents.length; i++){
            categories.push(midnight_reg_tracker.presidents[i].name);
        }

        midnight_reg_tracker.chart = Highcharts.chart("midnight_regs_chart", {
            chart: {type: 'column'},
            title: {text: 'Midnight Rules by President'},
            subtitle: {text: 'as of ' + today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear()},
            credits: {
                text: "Source: Federal Register. Produced by QuantGov.",
                href: "http://quantgov.org"
            },
            xAxis: {categories: categories},
            yAxis: {
                visible: false,
                title: {enabled: false},
            },
            plotOptions: {
                series: {stacking: 'normal'}
            },
            series: [
            {name: "Non-Significant Midnight Rules", data: [0, 0, 0]},
            {name: "Significant Midnight Rules", data: [0, 0, 0]},
            ],
            exporting: {
                enabled: false,
                filename: 'quantgov_midnight_regulations_tracker_' + today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + (today.getDate() + 1)).slice(-2),
            },
        });
        midnight_reg_tracker.chart.showLoading();
        midnight_reg_tracker.get_rule_counts(midnight_reg_tracker.presidents[midnight_reg_tracker.presidents.length - 1], 'sig');
        midnight_reg_tracker.get_rule_counts(midnight_reg_tracker.presidents[midnight_reg_tracker.presidents.length - 1], 'nonsig');
    }
});
