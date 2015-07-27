
Project is similar in functionality to no-ip service, it using casperjs ( phantomjs ) . 
It will allow you to update your external ip with specfic subdomain at www.123-reg.co.uk registrat.

Setup:
Clone repo to root directory.
Look at config.js to change credentials. 

Run ./update_dns_ip to check if is working 

To run every 30 minutes as root  add this line to your crontab:
*/30 * * * * root  bash -c "cd /path_to_repo/update_dns_ip/; ./update_ip " 

It saving logs for all runs inside logs directory ( will create  in first run );

