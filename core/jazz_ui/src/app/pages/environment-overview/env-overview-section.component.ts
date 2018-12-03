import { Component, OnInit, Input , OnChanges, SimpleChange, Output, EventEmitter } from '@angular/core';
import { RequestService ,MessageService} from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import { ToasterService} from 'angular2-toaster';
import { DataService } from "../data-service/data.service";
import { DataCacheService , AuthenticationService } from '../../core/services/index';
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';
import { environmentDataService } from '../../core/services/environments.service';  
import * as moment from 'moment';

@Component({
  selector: 'env-overview-section',
  templateUrl: './env-overview-section.component.html',
  providers: [RequestService,MessageService,DataService,environmentDataService],
  styleUrls: ['./env-overview-section.component.scss']
})
export class EnvOverviewSectionComponent implements OnInit {
  
  @Output() onload:EventEmitter<any> = new EventEmitter<any>();
  @Output() envLoad:EventEmitter<any> = new EventEmitter<any>();
  @Output() open_sidebar:EventEmitter<any> = new EventEmitter<any>();

  accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	  accSelected:string = this.accList[0];
  regSelected:string=this.regList[0];
 

  @Output() frndload:EventEmitter<any> = new EventEmitter<any>();
  
  
  private http:any;
  private sub:any;
  private env:any;
  branchname: any;
  friendlyChanged:boolean = false;
  tempFriendlyName:string;
  friendlyName : string;
  lastCommitted: any;
  editBtn:boolean = true;
  saveBtn:boolean = false;
  showCancel:boolean = false;
  environment:any;
  deployments:any={};
  envResponseEmpty:boolean = false;
  envResponseTrue:boolean = false;
  envResponseError:boolean = false;
  isLoading: boolean = true;
  isDeploymentLoading: boolean = true;
  dayscommit: boolean = false;
  hourscommit: boolean = false;
  seccommit: boolean = false;
  mincommit: boolean = false;
  commitDiff: any;
  copylinkmsg = "COPY LINK TO CLIPBOARD";
  envstatus:any;
  status_val:number;
  errorTime:any;
	errorURL:any;
	errorAPI:any;
	errorRequest:any={};
	errorResponse:any={};
	errorUser:any;
	errorChecked:boolean=true;
	errorInclude:any="";
  json:any={};
  desc_temp:any;
  toastmessage:any;
  copyLink:string="Copy Link";
 
  message:string="lalalala"
  
  
  private subscription:any;
  private deploySubscription:any;

  @Input() service: any = {};
  
  temp_description:string;
  put_payload:any = {};
  services = {
    description:'NA', 
    lastcommit:'NA',
    branchname:'NA',
    endpoint:'NA',
    repository:'NA',
    runtime:'NA',
    tags: 'NA'
  };
  endpList:any;
  constructor(
    private request:RequestService,
    private route: ActivatedRoute,
    private router: Router,
    private cache: DataCacheService,
    private toasterService: ToasterService,
    private messageservice:MessageService,
    private data: DataService,
    private environmentDataService: environmentDataService,
    private authenticationservice: AuthenticationService ,
  ) {
    this.http = request;
    this.toastmessage = messageservice;

   }

  refresh() {
    this.envResponseEmpty = false;
    this.envResponseTrue = false;
    this.envResponseError = false;
    this.isLoading = true;
    this.isDeploymentLoading = true;
    this.clearEnvCache();
    this.ngOnInit();
  }
  //  prd?domain=jazz-testing&service=test-create

  disableEditBtn(){

  }
popup(state){
  if(state == 'enter'){
    var ele = document.getElementById('popup-endp');
  ele.classList.add('endp-visible');
  }
  if(state == 'leave'){
    var ele = document.getElementById('popup-endp');
    ele.classList.remove('endp-visible');
  }
  
}
  onEditClick(){
    
    this.tempFriendlyName=this.friendlyName;
    this.showCancel=true;
    this.saveBtn=true;
    this.editBtn=false;

  }
  onSaveClick(){
    this.showCancel=false;
    this.saveBtn=false;
    this.editBtn=true;
    var errMsgBody;

    if(this.friendlyChanged){
      // clear cache and fetch env again
      this.clearEnvCache();
      this.put_payload.friendly_name= this.tempFriendlyName;
      this.http.put('/jazz/environments/'+ this.env +'?domain=' + this.service.domain + '&service=' + this.service.name,this.put_payload)
            .subscribe(
                (Response)=>{
                  let successMessage = this.toastmessage.successMessage(Response,"updateEnv");
                  this.toast_pop('success',"",successMessage);

                  this.callServiceEnv();
                  this.tempFriendlyName='';
                },
                (error)=>{
                  try{
                    errMsgBody=JSON.parse(error._body);
                  }
                  catch(e){
                  }
                  let errorMessage='';
                  if(errMsgBody!=undefined)
                    errorMessage = errMsgBody.message;
                  // let errorMessage = this.toastmessage.errorMessage(Error,"updateEnv");
                  this.toast_pop('error', 'Oops!', errorMessage)
                  this.callServiceEnv();

                }
              );
              this.isLoading=true;
              this.envResponseTrue=false;
              this.friendlyChanged=false;
              
    }
    
  }

  clearEnvCache(){
    this.environmentDataService.clearEnvironmentCache(this.service.domain, this.service.name, this.env);
  }

  onCancelClick(){
    this.showCancel=false;
    this.saveBtn=false;
    this.editBtn=true;
    this.tempFriendlyName='';
  }
  toast_pop(error,oops,errorMessage)
  {
    var tst = document.getElementById('toast-container');
       tst.classList.add('toaster-anim');
      this.toasterService.pop(error,oops,errorMessage);
      setTimeout(() => {
          tst.classList.remove('toaster-anim');
        }, 3000);
  }

  formatLastCommit(){
    
    var commit = this.lastCommitted.substring(0,19);
    var lastCommit = new Date(commit);
    var now = new Date(); 
    var todays = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
            
            this.dayscommit = true;
            this.commitDiff = Math.floor(Math.abs((todays.getTime() - lastCommit.getTime())/(1000*60*60*24)));
            if( this.commitDiff == 0 ){
              this.dayscommit = false;
              this.hourscommit = true;
              this.commitDiff = Math.floor(Math.abs((todays.getHours() - lastCommit.getHours())));
              if( this.commitDiff == 0 ){
                this.dayscommit = false;
                this.hourscommit = false;
                this.mincommit = true;
                this.commitDiff = Math.floor(Math.abs((todays.getMinutes() - lastCommit.getMinutes())));
                if( this.commitDiff == 0 ){
                  this.dayscommit = false;
                  this.hourscommit = false;
                  this.mincommit = false;
                  this.seccommit = true;
                  this.commitDiff = "just now";
                }
              }
            }

  }
  openSidebar(){
    this.open_sidebar.emit(true);
  }

  get24HourDeployment(deploymentsArray){
    var count = 0;
    if (!deploymentsArray) return 'NA'
    for (var i = 0; i < deploymentsArray.length; i++){
      var time = deploymentsArray[i].created_time.slice(0,-4);
      // time format is UTC, need to convert to local time
      time = moment.utc(time).local();
      // get local time
      var now = new Date;
      var diff = moment(now).diff(moment(time),"second");
      if (diff <= 24 * 60 * 60) {
        count ++
      }
    }
    // return as string so when the count it 0, it won't be treat as false in html (count || 'NA') => 0 will be shown as 'NA'
    return count.toString();
  }

  getLastDeployment(deploymentArray, status){
    if (!deploymentArray) return "NA"
    for (var i = 0; i < deploymentArray.length; i++){
      var deployment = deploymentArray[i];
      if (deployment.status == status){
        var time = deployment.created_time.slice(0,-4);
        // time format is UTC, need to convert to local time
        time = moment.utc(time).local();
        // get local time
        var now = new Date;
        var diff = moment(now).diff(moment(time),"second");
        if (diff <= 24 * 60 * 60) {
          return moment(time).fromNow();
        } else {
          return moment(time).format('ll');
        }
      }
    }    
  }
   
  getDeployments(){
    if (!this.env || !this.service.domain ||!this.service.name) {
      return
    }
    this.deploySubscription = this.http.get('/jazz/deployments' + '?domain=' + this.service.domain + '&service=' + this.service.name + "&environment=" + this.env).subscribe(
      (response) => {
        if(response.data == (undefined || '')){
          this.isDeploymentLoading = false;
          return
        }else if (response.data.deployments){
          this.isDeploymentLoading = false;
          this.deployments = response.data;
          this.deployments.deploymentsCountvalue = this.get24HourDeployment(this.deployments.deployments);
          this.deployments.lastSuccessfulDeployment = this.getLastDeployment(this.deployments.deployments, 'successful');
          this.deployments.lastFailedDeployment = this.getLastDeployment(this.deployments.deployments, 'failed');
          this.deployments.lastDeploymentStatus = this.deployments.deployments[0]? this.deployments.deployments[0].status : 'NA';
          this.cache.set('currentDeployments', this.deployments);
        }
      },
      (error) => {
        this.envResponseTrue = false;
        this.envResponseError = true;
        this.envResponseEmpty = false;
        this.isLoading = false;
        this.isDeploymentLoading = false;
    })
  }

  getEnvironment(response){
    if (response) {
      if(response.data == (undefined || '')){
        this.envResponseEmpty = true; 
        this.isLoading = false;
      }else{
        // response.data.environment[0].status='deletion_started'
        this.onload.emit(response.data.environment[0].endpoint);
        this.envLoad.emit(response.data);
        this.environment=response.data.environment[0];
        this.cache.set('currentEnv',this.environment);
        this.status_val = parseInt(status[this.environment.status]);

        var deployment_status = ["deployment_completed","active","deployment_started" ,"pending_approval","deployment_failed","inactive","deletion_started","deletion_failed","archived"]

        this.envstatus = deployment_status[this.status_val].replace("_"," ");

        var envResponse = response.data.environment[0];
        this.friendlyName = envResponse.friendly_name
        this.branchname = envResponse.physical_id;
        this.lastCommitted = envResponse.last_updated;
        this.frndload.emit(this.friendlyName);


        this.formatLastCommit();               
        
        this.envResponseTrue = true;
        this.envResponseEmpty = false;
        this.isLoading = false;
      }
    } else {
      // if( error.status == "404"){
      //   this.router.navigateByUrl('404');
      // }
      this.envResponseTrue = false;
      this.envResponseError = true;
      this.envResponseEmpty = false;
      this.isLoading = false;
    }
  }

  callServiceEnv() {
    var env = this.cache.get(this.service.domain + '/' + this.service.name + '/' + this.env);
    if (env) {
      this.onload.emit(this.environment.endpoint);
      this.getEnvironment(env);
      return
    }
    this.environmentDataService.getEnvironment(this.service.domain, this.service.name, this.env);
  };

  
    getTime() {
      var now = new Date();
      this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
      + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
      }
  
    feedbackRes:boolean=false;
    openModal:boolean=false;
      feedbackMsg:string='';
      feedbackResSuccess:boolean=false;
    feedbackResErr:boolean=false;
    isFeedback:boolean=false;
      toast:any;
      model:any={
          userFeedback : ''
    };
    buttonText:string='SUBMIT';
    // isLoading:boolean=false;
    sjson:any={};
		djson:any={};
		// isLoading:boolean=false;
		reportIssue(){
			
					this.json = {
						"user_reported_issue" : this.model.userFeedback,
						"API": this.errorAPI,
						"REQUEST":this.errorRequest,
						"RESPONSE":this.errorResponse,
						"URL": this.errorURL,
						"TIME OF ERROR":this.errorTime,
						"LOGGED IN USER":this.errorUser
				}
				
					this.openModal=true;
					this.errorChecked=true;
					this.isLoading=false;
					this.errorInclude = JSON.stringify(this.djson);
					this.sjson = JSON.stringify(this.json);
				}
			
				openFeedbackForm(){
					this.isFeedback=true;
					this.model.userFeedback='';
					this.feedbackRes=false;
					this.feedbackResSuccess=false;
					this.feedbackResErr=false;
					this.isLoading = false;
					this.buttonText='SUBMIT';
        }
        reportEmail:string;
				mailTo(){
					location.href='mailto:'+this.reportEmail+'?subject=Jazz : Issue reported by'+" "+ this.authenticationservice.getUserId() +'&body='+this.sjson;
				}
				errorIncluded(){
				}
			 
				submitFeedback(action){
			
					this.errorChecked = (<HTMLInputElement>document.getElementById("checkbox-slack")).checked;
					if( this.errorChecked == true ){
						this.json = {
								"user_reported_issue" : this.model.userFeedback,
								"API": this.errorAPI,
								"REQUEST":this.errorRequest,
								"RESPONSE":this.errorResponse,
								"URL": this.errorURL,
								"TIME OF ERROR":this.errorTime,
								"LOGGED IN USER":this.errorUser
						}
					}else{
						this.json = this.model.userFeedback ;
					}
					this.sjson = JSON.stringify(this.json);
			
					this.isLoading = true;
			
					if(action == 'DONE'){
						this.openModal=false;
						return;
					}
			
					var payload={
						"title" : "Jazz: Issue reported by "+ this.authenticationservice.getUserId(),
						"project_id":env_internal.urls.internal_acronym,
						"priority": "P4",
						"description": this.json,
						"created_by": this.authenticationservice.getUserId(),
						"issue_type" :"bug"
					}
					this.http.post('/jazz/jira-issues', payload).subscribe(
						response => {
							this.buttonText='DONE';
							this.isLoading = false;
							this.model.userFeedback='';
							var respData = response.data;
							this.feedbackRes = true;
							this.feedbackResSuccess= true;
							if(respData != undefined && respData != null && respData != ""){
								this.feedbackMsg = "Thanks for reporting the issue. We’ll use your input to improve Jazz experience for everyone!";
							} 
						},
						error => {
							this.buttonText='DONE';
							this.isLoading = false;
							this.feedbackResErr = true;
							this.feedbackRes = true;
							this.feedbackMsg = this.toastmessage.errorMessage(error, 'jiraTicket');
						  }
					);
				}


   myFunction() {
    setTimeout( this.resetCopyValue(), 3000);
 }
 
 resetCopyValue(){
    this.copylinkmsg = "COPY LINK TO CLIPBOARD";
 }
 
 copyClipboard(copyapilinkid){
  var element = null; // Should be <textarea> or <input>
  element = document.getElementById(copyapilinkid);
  element.select();
  try {
      document.execCommand("copy");
      this.copylinkmsg = "LINK COPIED";
  }
  finally {
     document.getSelection().removeAllRanges;
  }
}
isOSS:boolean=false;
form_endplist(){
  // this.endpList=env_internal.urls.endplist;
}
  ngOnInit() {  
    this.form_endplist();
    if(environment.envName=='oss')this.isOSS=true;
    if(this.service.domain != undefined){
      this.environmentDataService.environment.subscribe((res) => {
        this.getEnvironment(res)
      });
      this.callServiceEnv();
      //this.data.currentMessage.subscribe(message => this.message = message)
    }       
  }

  ngOnChanges(x:any) {
    this.route.params.subscribe(
      params => {
      this.env = params.env;
    });
    this.environment={};
    if(this.service.domain != undefined){
      this.callServiceEnv();
      this.getDeployments();
    }
}
notify(services){
  this.service=services;
 
  if(this.service.domain != undefined)
      {
        
        this.callServiceEnv();
      }
}
refreshCostData(event){ 
  this.callServiceEnv();
}

public goToAbout(hash){
	this.router.navigateByUrl('landing');
	this.cache.set('scroll_flag',true);
	this.cache.set('scroll_id',hash);
}

focusindex:number;
    showRegionList:boolean;
    showAccountList:boolean;
    selectedAccount=[];
    selectedRegion=[];
    scrollList:any;
    onRegionChange(newVal) {
        if (!newVal) {
          this.showRegionList = false;
        } else {
          this.showRegionList = true;
        }
      }
      onAccountChange(newVal) {
        if (!newVal) {
          this.showAccountList = false;
        } else {
          this.showAccountList = true;
        }
      }
    
      focusInputAccount(event) {
        document.getElementById('AccountInput').focus();
      }
    
      focusInputRegion(event) {
        document.getElementById('regionInput').focus();
      }

      selRegion:any;
      selApprover:any;
      accounts = this.accList;
      regions = this.regList
selectAccount(account){
  this.selApprover = account;
    let thisclass: any = this;
    this.showAccountList = false;
    thisclass.AccountInput = '';
    this.selectedAccount.push(account);
    this.put_payload.accounts=this.selectedAccount;
    this.friendlyChanged=true;
    for (var i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i] === account) {
        this.accounts.splice(i, 1);
        return;
      }
    }
}
removeAccount(index, account) {
  this.accounts.push(account);
  this.selectedAccount.splice(index, 1);
  this.friendlyChanged=true;
}
selectRegion(region){
  this.selApprover = region;
    let thisclass: any = this;
    this.showRegionList = false;
    thisclass.regionInput = '';
    this.selectedRegion.push(region);
    this.put_payload.regions=this.selectedRegion;
    this.friendlyChanged=true;

    for (var i = 0; i < this.regions.length; i++) {
      if (this.regions[i] === region) {
        this.regions.splice(i, 1);
        return;
      }
    }
}
copy_link(id)
    {  
        var element = null; // Should be <textarea> or <input>
        element = document.getElementById(id);
        element.select();
        try {
            document.execCommand("copy");
            this.copyLink = "Link Copied";
            setTimeout(() => {
              this.copyLink = "Copy Link";
            }, 3000);
            
        }
        finally {
            document.getSelection().removeAllRanges;
        }
    }
removeRegion(index, region) {
  this.regions.push(region);
  this.selectedRegion.splice(index, 1);
  this.friendlyChanged=true;
}
keypressAccount(hash){
  if (hash.key == 'ArrowDown') {
    this.focusindex++;
    if (this.focusindex > 0) {
      var pinkElements = document.getElementsByClassName("pinkfocus")[0];
      if (pinkElements == undefined) {
        this.focusindex = 0;
      }
      // var id=pinkElements.children[0].innerHTML;
    }
    if (this.focusindex > 2) {
      this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

    }
  }
  else if (hash.key == 'ArrowUp') {
    if (this.focusindex > -1) {
      this.focusindex--;

      if (this.focusindex > 1) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
      }
    }
    if (this.focusindex == -1) {
      this.focusindex = -1;


    }
  }
  else if (hash.key == 'Enter' && this.focusindex > -1) {
    event.preventDefault();
    var pinkElement = document.getElementsByClassName("pinkfocus")[0].children;

    var approverObj = pinkElement[0].attributes[2].value;
    
    this.selectAccount(approverObj);

    this.focusindex = -1;

  } else {
    this.focusindex = -1;
  }
}

keypressRegion(hash){
    if (hash.key == 'ArrowDown') {
        this.focusindex++;
        if (this.focusindex > 0) {
          var pinkElements = document.getElementsByClassName("pinkfocus2")[0];
          if (pinkElements == undefined) {
            this.focusindex = 0;
          }
          // var id=pinkElements.children[0].innerHTML;
        }
        if (this.focusindex > 2) {
          this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
    
        }
      }
      else if (hash.key == 'ArrowUp') {
        if (this.focusindex > -1) {
          this.focusindex--;
    
          if (this.focusindex > 1) {
            this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
          }
        }
        if (this.focusindex == -1) {
          this.focusindex = -1;
    
    
        }
      }
      else if (hash.key == 'Enter' && this.focusindex > -1) {
        event.preventDefault();
        var pinkElement = document.getElementsByClassName("pinkfocus2")[0].children;
    
        var approverObj = pinkElement[0].attributes[2].value;
        
        this.selectRegion(approverObj);
    
        this.focusindex = -1;
    
      } else {
        this.focusindex = -1;
      }
}
}

export enum status {
  "deployment_completed"=0,
  "active",
  "deployment_started" ,
  "pending_approval",
  "deployment_failed",
  "inactive",
  "deletion_started",
  "deletion_failed",
  "archived"
}
