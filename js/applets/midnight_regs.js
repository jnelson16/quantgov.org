var midnight_reg_tracker = {};
$(function(){
    midnight_reg_tracker.presidents = [{
        name: 'Bill Clinton, 1st Term',
        year: 1996,
        election_day: 5,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }, {
        name: 'Bill Clinton, 2nd Term',
        year: 2000,
        election_day: 7,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }, {
        name: 'George W. Bush, 1st Term',
        year: 2004,
        election_day: 2,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }, {
        name: 'George W. Bush, 2nd Term',
        year: 2008,
        election_day: 4,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }, {
        name: 'Barack Obama, 1st Term',
        year: 2012,
        election_day: 6,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }, {
        name: 'Barack Obama, 2nd Term',
        year: 2016,
        election_day: 8,
        possibles: [],
        midnights_nonsig: [],
        midnights_sig: [],
        ready: false,
    }];

    midnight_reg_tracker.get_possible_rules = function(president, page) {
        if (page === undefined) {
            page = 1;
        }
        if (page == 1) {
            console.log("Processing " + president.name);
        }
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
                data: {
                    'per_page': 1000,
                    'page': page,
                    'fields[]': ['regulation_id_numbers'],
                    'conditions[type]': 'PRORULE',
                    'conditions[publication_date][gte]': president.year + '-06-01',
                    'conditions[publication_date][lte]': (president.year + 1) + '-01-20'
                },
                dataType: 'jsonp',
                success: function(data) {
                    var reg;
                    for (var i = 0; i < data.results.length; i++) {
                        reg = data.results[i].regulation_id_numbers[0];
                        if (reg === undefined){
                            continue;
                        }
                        if ($.inArray(reg, president.possibilities) == -1){
                            president.possibles.push(reg);
                        }


                    }
                    var total_pages = data.total_pages || 1;
                    if (page != total_pages) {
                        midnight_reg_tracker.get_possible_rules(president, page + 1);
                    } else {
                        midnight_reg_tracker.identify_midnights(president);
                    }
                },
                error: window.console.log
    });
    }
    midnight_reg_tracker.identify_midnights = function(president, page) {
        if (page === undefined) {
            page = 1;
        }
        $.ajax('https://www.federalregister.gov/api/v1/documents.json', {
                data: {
                    'per_page': 1000,
                    'fields[]': ['regulation_id_numbers', 'significant'],
                    'page': page,
                    'conditions[type]': 'RULE',
                    'conditions[publication_date][gte]': president.year + '-11-0' + (president.election_day + 1),
                    'conditions[publication_date][lte]': (president.year + 1) + '-01-20'
                },
                dataType: 'jsonp',
                success: function(data) {
                    var reg;
                    if (data.count == 0) {
                        data.results = [];
                    }
                    for (var i = 0; i < data.results.length; i++) {
                        reg = data.results[i];
                        rin = reg['regulation_id_numbers'][0]
                        if (rin === undefined){
                            continue;
                        }
                        if (reg.significant){
                            if ($.inArray(rin, president.midnights_sig) == -1 && $.inArray(rin, president.possibles) != -1) {
                                president.midnights_sig.push(rin);
                            }
                        } else {
                            if ($.inArray(rin, president.midnights_nonsig) == -1 && $.inArray(rin, president.possibles) != -1) {
                                president.midnights_nonsig.push(rin);
                            }
                        }
                    }
                    var total_pages = data.total_pages || 1;
                    if (page != total_pages) {
                        midnight_reg_tracker.identify_midnights(idx, page + 1);
                    } else {
                        console.log("Done with " + president.name);
                        president.ready = true;
                        for (var i = 0; i < midnight_reg_tracker.presidents.length; i++){
                            if (!midnight_reg_tracker.presidents[i].ready){
                                return;
                            }
                        }
                        midnight_reg_tracker.display();
                    }
                },
                error: console.log
        });
    }
    
    midnight_reg_tracker.display = function(){
        var nonsig = [];
        var sig = [];
        for (var i = 0; i < midnight_reg_tracker.presidents.length; i++){
            sig.push(midnight_reg_tracker.presidents[i].midnights_sig.length);
            nonsig.push(midnight_reg_tracker.presidents[i].midnights_nonsig.length);
        }

        midnight_reg_tracker.chart.series[0].setData(nonsig);
        midnight_reg_tracker.chart.series[1].setData(sig);
        midnight_reg_tracker.chart.update({
            exporting: {enabled: true},
            yAxis: { visible: true },
        });
        midnight_reg_tracker.chart.hideLoading();


    };

    var president;
    var categories = [];
    for (var i = 0; i < midnight_reg_tracker.presidents.length; i++){
        president = midnight_reg_tracker.presidents[i];
        midnight_reg_tracker.get_possible_rules(president);
        categories.push(president.name);
    }
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var today = new Date();

    midnight_reg_tracker.chart = Highcharts.chart("midnight_regs_container", {
            chart: {type: 'column'},
            title: {text: 'Midnight Rules by President'},
            subtitle: {text: 'as of ' + today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear()},
            credits: {
                text: "Source: Federal Register. Produced by QuantGov",
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
                {name: "Non-Significant Midnight Rules", data: [0, 0, 0, 0, 0, 0]},
                {name: "Significant Midnight Rules", data: [0, 0, 0, 0, 0, 0]},
            ],
            exporting: {enabled: false},
        });
    midnight_reg_tracker.chart.showLoading();
});
