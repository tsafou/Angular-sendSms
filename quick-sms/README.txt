1) Inject quickSms to your main module.
2) Configure the API in your app config like so: 
	ktSendSmsProvider.apiUrl(/API);
3) Include quick-sms.js to your script files

You can then use this module by inserting the directive send-sms. You can also overwrite any default values by using your own config object.
	<send-sms config="yourConfigObj"></send-sms>