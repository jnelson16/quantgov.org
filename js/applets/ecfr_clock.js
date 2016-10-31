document.write('<div id="ecfr_clock" style="width: 100%; text-align:center;border:5px double darkgrey;padding: 1em;"></div>');
var ecfr_clock = ecfr_clock || {};
ecfr_clock.today = new Date();
ecfr_clock.thisyear = ecfr_clock.today.getFullYear();
ecfr_clock.url = "/resources/ecfr_clock.json";
ecfr_clock.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

ecfr_clock.update_clock = function(data){
    var date = ecfr_clock.months[ecfr_clock.today.getMonth()] + " " + ecfr_clock.today.getDate() + ", " + ecfr_clock.today.getFullYear();
    var reading_speed = 250;
    var minutes_per_year = 60 * 40 * 50; // 40 hours per week, 2 week vacation per year
    var minutes_per_day = 60 * 8; // 8 hour days

    var minutes = data.wordcount / reading_speed;
    var years = Math.floor(minutes / minutes_per_year);
    minutes = minutes % minutes_per_year;
    var days = Math.floor(minutes / (minutes_per_day));
    minutes = minutes % minutes_per_day;
    var hours = Math.floor(minutes / 60);
    minutes = Math.round(minutes / 60);



    $("#ecfr_clock").append(
            '<p>As of ' + date +', there are<br><span style="font-size: 3em">' + data.wordcount.toLocaleString() +
            '</span><br>words in the <i>Code of Federal Regulations</i>,including <br><span style="font-size:2.5em">' +
            data.restrictions.toLocaleString() + '</span><br>regulatory restrictions.</p>'
            );
    $("#ecfr_clock").append(
            'Reading ' + reading_speed + ' words per minute as as a full time job, ' +
            'it would take<br><span style="font-size: 3em;">' + years + ' years, ' + days + ' days, ' + hours + ' hours and ' + minutes + ' minutes</span><br>to read the whole thing.</p>'
            );
}

ecfr_clock.init = function(){
    $.ajax(ecfr_clock.url, {
        dataType: 'json',
        success: ecfr_clock.update_clock,
        error: function(r, textstatus, errorthrown){
            alert(textstatus + '\n' + errorthrown);
        }
    });
};
$(ecfr_clock.init);
