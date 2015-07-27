
var config = require("config");

var casper = require("casper").create({
    waitTimeout: 5000,
    verbose: true,
    logLevel: "debug",
    pageSettings: {
        webSecurityEnabled: false,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    }
});

casper.on('remote.message', function (msg) {
    // uncomment line below for more verbose
    // console.log(msg);
});

new_ip = '';

casper.start("http://192.168.0.1/sky_router_status.html");
casper.setHttpAuth(config.sky_user, config.sky_password);
casper.then(function () {
    new_ip = this.evaluate(function () {

        var old_ip = '';
        var ip_cookie = document.cookie.match(/NEW-IP=(\d+\.\d+\.\d+\.\d+)/);
        if (ip_cookie) {
            old_ip = ip_cookie[1];
        }
        var new_ip = document.querySelectorAll('tbody tr td ')[12].innerText;
        return old_ip !== new_ip ? new_ip : "";
    });

    if (new_ip === "") {
        this.echo("No change exit", "INFO");
        this.exit();
    }
    if (new_ip == null) {
        this.echo("New IP is null");
        this.exit();
    } else {
        this.echo("New IP " + new_ip, "INFO");
    }
});

casper.thenOpen("https://www.123-reg.co.uk/secure");
casper.thenBypassIf(function () {
    return this.evaluate(function () {
        return $('a[href*=logout]').length > 0;
    });
}, 1);

casper.waitFor(function check() {

    this.log(this.evaluate(function () {
        return location.href;
    }));

    return this.evaluate(function () {
        return document.querySelectorAll('a#login_to_cpl').length !== 0;
    });
}, function then() {
    // phantom is not setting all cookies
    this.evaluate(function () {
        document.cookie = "PSGI-XSRF-Token=" + $('meta[name=csrftoken]').attr('content');
    });
    this.fillSelectors('form[method=post][action="https://www.123-reg.co.uk/public/login"]', {
        'input#login_username': config.reg_user,
        'input#login_password': config.reg_pass
    }, true);
});

casper.waitForUrl('https://www.123-reg.co.uk/secure', function () {
    this.echo('Logged in ', "INFO");
});

casper.thenOpen('https://www.123-reg.co.uk/secure/cpanel/manage-dns/?domain=' + config.domain, function () {
    this.click('a#advanced-tab');
}).wait(5000);

casper.then(function () {
    var x = this.evaluate(function (subdomain, new_ip) {
        var t = $('span.dns_hostname:contains(' + subdomain + ')').parents('tr').text();
        $('span.dns_hostname:contains(' + subdomain + ')').parents('tr').find('a[title="Edit entry"]').click();
        $('input[value=cloud]').parents('tr').find('input[rel="ipv4"]').val(new_ip);
        $('input[value=cloud]').parents('tr').find('a.update_entry').click();
        return t.replace(/\s+/g, ' ');
    }, config.subdomain, new_ip);

    this.echo("info: " + x, 'INFO');

}).wait(10000, function () {
});

casper.thenOpen("http://192.168.0.1/", function () {
    this.evaluate(function (new_ip) {
        document.cookie = "NEW-IP=" + new_ip + "; expires=" + (new Date(new Date().getTime() + 52 * 31 * 24 * 3600 * 1000).toGMTString()) + "; path=/";
    }, new_ip);
    this.clickLabel('Logout');
}).wait(2000);

casper.run();

