/* ************************************ */
/* Define helper functions */
/* ************************************ */
//FUNCTIONS FOR GETTING FMRI SEQUENCES
function getdesignITIs(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/ITIs_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
} 
function getdesignEvents(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/events_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
} 

function getITI_stim() { //added for fMRI compatibility
	var currITI = ITIs_stim.shift()
	if (currITI == 0.0) {
		currITI = 0.1
	}
	return currITI
	return currITI
}

function getITI_resp() { //added for fMRI compatibility
	var currITI = ITIs_resp.shift()
	if (currITI == 0.0) { //THIS IS JUST FOR CONVENIENCE BEFORE NEW DESIGNS ARE REGENERATED
		currITI = 0.1
	}
	return currITI
}

//added for motor counterbalancing
function getMotorPerm() {
	return motor_perm
}

// var possible_responses = [['index finger', 89], ['index finger', 89], ['middle finger', 71], ['middle finger', 71]] //fmri responses - keys: BYGRM = thumb->pinky

function getPossibleResponses() {
	if (getMotorPerm()==0) {
		return possible_responses
	} else if (getMotorPerm()==1) {
		return [possible_responses[1], possible_responses[0]]
	}
}

var getChoices = function() {
	return [getPossibleResponses()[0][1], getPossibleResponses()[1][1]]
}


function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'stop_signal_with_flanker__fmri'})
}


function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('stop-signal')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	var correct = 0
	var all_trials = 0
	
		//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	choice_counts[70] = 0
	choice_counts[72] = 0
	
	for (var k = 0; k < possible_responses.length; k++) {
		choice_counts[possible_responses[k][1]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].trial_id == 'test_trial') {
			all_trials += 1
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (experiment_data[i].stop_signal_condition == 'go'){
				trial_count += 1
			}
			
			if ((experiment_data[i].stop_signal_condition == 'go') && (experiment_data[i].rt != -1)){
				rt = experiment_data[i].rt
				rt_array.push(rt)
				if (experiment_data[i].key_press == experiment_data[i].correct_response){
					correct += 1
				}
			} else if ((experiment_data[i].stop_signal_condition == 'stop') && (experiment_data[i].rt != -1)){
				rt = experiment_data[i].rt
				rt_array.push(rt)
			}  else if ((experiment_data[i].stop_signal_condition == 'go') && (experiment_data[i].rt == -1)){
				missed_count += 1
			}
		}		
	}
	
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = Math.median(rt_array)
	} 
	//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > all_trials * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	var accuracy = correct / trial_count
	credit_var = (missed_percent < 0.25 && avg_rt > 200 && responses_ok && accuracy > 0.60)
	jsPsych.data.addDataToLastTrial({final_credit_var: credit_var,
									 final_missed_percent: missed_percent,
									 final_avg_rt: avg_rt,
									 final_responses_ok: responses_ok,
									 final_accuracy: accuracy})
}

// feedback functions added for in-person version
var getRefreshFeedback = function() {
	if (getRefreshTrialID()=='instructions') {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><div class = instructbox>'+
		'<p class = instruct-text>In this experiment you will see a row of letters.</p> '+
		'<p class = instruct-text>If the middle letter is H, press your '+getPossibleResponses()[0][0]+'.</p>'+
		'<p class = instruct-text>If the middle letter is F, press your '+getPossibleResponses()[1][0]+'.</p>'+
		'<p class = instruct-text>Respond as quickly and accurately as possible. Please ignore the letters not in the middle.</p>'+
		'<p class = instruct-text>On some trials, a star will appear around the letters.  The star will appear with, or shortly after the letters appear.</p>'+
		'<p class = instruct-text>If you see a star appear, please try your best to make no response on that trial.</p>'+
		'<p class = instruct-text>If the star appears on a trial, and you try your best to withhold your response, you will find that you will be able to stop sometimes but not always.</p>'+
		'<p class = instruct-text>Please do not slow down your response to the middle letter in order to wait for the star.  Continue to respond as quickly and accurately as possible.</p>'+
		'<p class = instruct-text>During practice, you will see a reminder of the rules.  <i> This will be removed for the test</i>. </p>'+ 
		'<p class = instruct-text>To let the experimenters know when you are ready to begin, please press any button. </p>'+
		'</div>' + '</font></p></div></div>'

	} else {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white">' + refresh_feedback_text + '</font></p></div></div>'
	}
	
}

var getRefreshTrialID = function() {
	return refresh_trial_id
}

var getRefreshFeedbackTiming = function() {
	return refresh_feedback_timing
}

var getRefreshResponseEnds = function() {
	return refresh_response_ends
}

// var getPracticeFeedback = function() {
// 	return '<div class = bigbox><div class = picture_box><p class = block-text>' + practice_feedback_text + '</p></div></div>'
// }


var getFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + feedback_text + '</p></div></div>'
}

var getCategorizeFeedback = function(){
	curr_trial = jsPsych.progress().current_trial_global - 1
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	if ((trial_id == 'practice_trial') && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition != 'stop')){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response){
			
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + getPromptText()
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1)){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>' + getPromptText()
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>' + getPromptText()
	
		}
	} else if ((trial_id == 'practice_trial') && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop')){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).rt == -1){
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + getPromptText()
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).rt != -1){
			return '<div class = fb_box><div class = center-text><font size = 20>There was a star.</font></div></div>' + getPromptText()
		}
	}
}

var randomDraw = function(lst) {
  return lst[Math.floor(Math.random() * (lst.length))]
}
							 
// var createRefreshTrialTypes = function(numTrialsPerBlock){
// 	stop_signal_trial_types = ['go','go','stop']
// 	flanker_trial_types = ['congruent','incongruent']
// 	flanker_letters = ['H','F']
	
// 	var stims = []
// 	for(var numIterations = 0; numIterations < numTrialsPerBlock/(flanker_trial_types.length*stop_signal_trial_types.length); numIterations++){
// 		for (var numFlankerConds = 0; numFlankerConds < flanker_trial_types.length; numFlankerConds++){
// 			for (var numstop_signalConds = 0; numstop_signalConds < stop_signal_trial_types.length; numstop_signalConds++){
			
// 				flanker_condition = flanker_trial_types[numFlankerConds]
// 				stop_signal_condition = stop_signal_trial_types[numstop_signalConds]
// 				center_idx = Math.floor(Math.random() * 2) // will be 0 (H) or 1 (F)

// 				if (stop_signal_condition =='stop'){
// 					correct_response = -1
// 				} else {
// 					correct_response = getPossibleResponses()[center_idx][1]
// 				}

// 				if (flanker_condition == 'incongruent'){
// 					flanker_idx = center_idx ^ 1 //XOR flips 1s to 0s and vice versa
// 				} else {
// 					flanker_idx = center_idx
// 				}
			
// 				stim = {
// 					stop_signal_condition: stop_signal_condition,
// 					flanker_condition: flanker_condition,
// 					correct_response: correct_response,
// 					center_letter: flanker_letters[center_idx],
// 					flanker_letter: flanker_letters[flanker_idx]
// 					}
// 				stims.push(stim)	
				
// 			}
// 		}
// 	}
// 	stims = jsPsych.randomization.repeat(stims,1)
// 	return stims	
// }

var createTrialTypes = function(numTrialsPerBlock, des_events){
	flanker_letters = ['H','F']

	var stims = []
	for(var numIterations = 0; numIterations < numTrialsPerBlock; numIterations++){

		event_str = des_events.shift()
		center_idx = Math.floor(Math.random() * 2) // will be 0 (H) or 1 (F)

		if (event_str.includes('stop')){
			stop_signal_condition = 'stop'
			correct_response = -1
		} else {
			stop_signal_condition = 'go'
			correct_response = getPossibleResponses()[center_idx][1]
		}

		if (event_str.includes('incongruent')){
			flanker_condition = 'incongruent'
			flanker_idx = center_idx ^ 1 //XOR flips 1s to 0s and vice versa
		} else {
			flanker_condition = 'congruent'
			flanker_idx = center_idx
		}
	
		stim = {
			stop_signal_condition: stop_signal_condition,
			flanker_condition: flanker_condition,
			correct_response: correct_response,
			center_letter: flanker_letters[center_idx],
			flanker_letter: flanker_letters[flanker_idx]
			}
		stims.push(stim)	

	}
	return stims	
}

function getSSD(){
	if (flanker_condition == 'congruent'){
		return SSD_congruent
	} else if (flanker_condition == 'incongruent'){
		return SSD_incongruent
	}
}

function getSSType(){
	return stop_signal_condition

}

var getStopStim = function(){
	return stop_boards[0] + 
		   	preFileTypeStar + 'stopSignal' + fileTypePNG + 
		   stop_boards[1] 
}


var shiftStim = function(){
	stim = stims.shift()
	flanker_condition = stim.flanker_condition
	stop_signal_condition = stim.stop_signal_condition
	correct_response = stim.correct_response
	flanker_letter = stim.flanker_letter
	center_letter = stim.center_letter
}

var getStim = function(){ 	
	return flanker_boards[0]+ preFileType + flanker_letter + fileTypePNG +
		   flanker_boards[1]+ preFileType + flanker_letter + fileTypePNG +
		   flanker_boards[2]+ preFileType + center_letter + fileTypePNG +
		   flanker_boards[3]+ preFileType + flanker_letter + fileTypePNG +
		   flanker_boards[4]+ preFileType + flanker_letter + fileTypePNG
}


var appendData = function(){
	curr_trial = jsPsych.progress().current_trial_global
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	current_trial+=1
	
	
	if (trial_id == 'practice_trial'){
		current_block = 0 //0 for refresh block
	} else if (trial_id == 'test_trial'){
		current_block = testCount
	}
	
	jsPsych.data.addDataToLastTrial({
		flanker_condition: flanker_condition,
		stop_signal_condition: stop_signal_condition,
		correct_response: correct_response,
		flanker_letter: flanker_letter,
		center_letter: center_letter,
		current_block: current_block,
		current_trial: current_trial,
		SSD_congruent: SSD_congruent,
		SSD_incongruent: SSD_incongruent
	})
	
	
	if ((trial_id == 'test_trial') || (trial_id == 'practice_trial')){
		if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD_congruent < maxSSD) && (flanker_condition == 'congruent')){
			jsPsych.data.addDataToLastTrial({stop_acc: 1})
			SSD_congruent+=50
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD_congruent > minSSD) && (flanker_condition == 'congruent')){
			jsPsych.data.addDataToLastTrial({stop_acc: 0})
			SSD_congruent-=50
		}
		
		if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD_incongruent < maxSSD) && (flanker_condition == 'incongruent')){
			jsPsych.data.addDataToLastTrial({stop_acc: 1})
			SSD_incongruent+=50
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD_incongruent > minSSD) && (flanker_condition == 'incongruent')){
			jsPsych.data.addDataToLastTrial({stop_acc: 0})
			SSD_incongruent-=50
		}
		
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == correct_response){
			jsPsych.data.addDataToLastTrial({
				correct_trial: 1,
			})
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != correct_response){
			jsPsych.data.addDataToLastTrial({
				correct_trial: 0,
			})
		}
	}
}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = 0


// task specific variables
// Set up variables for stimuli
var practice_len = 12 // must be divisible by 12, [3 (go,go,stop) by 2 (flanker conditions) by 2 (flanker letters h and s)]
var refresh_len = 6
var exp_len = 300 // must be divisible by 12
var numTrialsPerBlock = 60; // divisible by 12
var numTestBlocks = exp_len / numTrialsPerBlock

var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_thresh = 0.10
var practice_thresh = 3 // 3 blocks of 12 trials

var SSD_congruent = true
var SSD_incongruent = true
var maxSSD = 1000
var minSSD = 0 
var maxStopCorrect = 0.70
var minStopCorrect = 0.30

var maxStopCorrectPractice = 1
var minStopCorrectPractice = 0

 
// var possible_responses = [['F Key', 70],['H Key', 72]]
var possible_responses = [['index finger', 89], ['middle finger', 71]]


var current_trial = 0
var current_block = 0

var fileTypePNG = '.png"></img>'
var preFileType = '<img class = center src="/static/experiments/stop_signal_with_flanker__fmri/images/'
var preFileTypeStar = '<img class = star src="/static/experiments/stop_signal_with_flanker__fmri/images/'

var stop_boards = ['<div class = bigbox><div class = centerbox><div class = starbox>','</div></div></div>']	   
var flanker_boards = [['<div class = bigbox><div class = centerbox><div class = flankerLeft_2><div class = cue-text>'],['</div></div><div class = flankerLeft_1><div class = cue-text>'],['</div></div><div class = flankerMiddle><div class = cue-text>'],['</div></div><div class = flankerRight_1><div class = cue-text>'],['</div></div><div class = flankerRight_2><div class = cue-text>'],['</div></div></div></div>']]					   
		

// var stims = createTrialTypes(practice_len)
var getPromptText = function(){
	return '<ul style = "text-align:left;"><font color=white>'+
			'<li>Indicate the identity of the middle letter</li>' +
			'<li>If the middle letter is H: '+getPossibleResponses()[0][0]+'.</li>'+
		    '<li>If the middle letter is F, press your '+getPossibleResponses()[1][0]+'.</li>'+
			'<li>Do not respond if you see a star around the letters!</li>' +
			'<li>Do not slow down your responses to the letter to wait for the star.</li>' +
			'</font></ul>'
}

var pathDesignSource = "/static/experiments/stop_signal_with_flanker__fmri/designs/" //ADDED FOR fMRI SEQUENCES

var pathSource = "/static/experiments/stop_signal_with_flanker__fmri/images/"
var images = []
images.push(pathSource + 'F' + '.png')
images.push(pathSource + 'H' + '.png')
images.push(pathSource + 'stopSignal.png')
jsPsych.pluginAPI.preloadImages(images);



//ADDED FOR SCANNING
//fmri variables
var ITIs_stim = []
var ITIs_resp = []
var stims = []
var motor_perm = 0
var refresh_trial_id = "instructions"
var refresh_feedback_timing = -1
var refresh_response_ends = true
var refresh_feedback_text = ""
var refresh_events = ['go_congruent', 'go_congruent', 'go_incongruent', 'go_incongruent', 'stop_congruent', 'stop_incongruent']
/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

var feedback_text = 
	'Welcome to the experiment. This experiment will take around 10 minutes. Press <i>space</i> to begin.'
// var practice_feedback_block = {
// 	type: 'poldrack-single-stim',
// 	data: {
// 		trial_id: "feedback_block"
// 	},
// 	choices: [32],
// 	stimulus: getPracticeFeedback,
// 	timing_post_trial: 0,
// 	is_html: true,
// 	timing_response: 180000,
// 	response_ends_trial: true, 

// };

var refresh_feedback_block = {
	type: 'poldrack-single-stim',
	stimulus: getRefreshFeedback,
	data: {
		trial_id: getRefreshTrialID,
	},
	choices: [32],

	timing_post_trial: 0,
	is_html: true,
	timing_response: getRefreshFeedbackTiming, //10 seconds for feedback
	timing_stim: getRefreshFeedbackTiming,
	response_ends_trial: getRefreshResponseEnds,
	on_finish: function() {
		refresh_trial_id = "feedback_block"
		refresh_feedback_timing = 10000
		refresh_response_ends = false

	} 

};

var feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: "feedback_block"
	},
	choices: [32],
	stimulus: getFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 10000,
	response_ends_trial: false, 

};

var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>',
	cont_key: [32],
	timing_post_trial: 0,
	on_finish: function(){
  	assessPerformance()
  }
};


var fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "fixation",
	},
	timing_post_trial: 0,
	timing_stim: getITI_stim, //500
	timing_response: getITI_resp, //500
	on_finish: shiftStim,
};

/********************************************/
/*				Set up nodes				*/
/********************************************/
var design_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "design_setup"
	},
	questions: [
		[
			"<p class = center-block-text>Design permutation (0-4):</p>"
		]
	], on_finish: async function(data) {
		design_perm = parseInt(data.responses.slice(7, 10))
		des_ITIs = await getdesignITIs(design_perm)
		des_ITIs = des_ITIs.map(Number)
		ITIs_stim = des_ITIs.slice(0)
		ITIs_resp = des_ITIs.slice(0)
		des_events = await getdesignEvents(design_perm)
	}
}

var motor_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "motor_setup"
	},
	questions: [
		[
			"<p class = center-block-text>motor permutation (0-1):</p>"
		]
	], on_finish: function(data) {
		motor_perm=parseInt(data.responses.slice(7, 10))
		stims = createTrialTypes(refresh_len, jsPsych.randomization.repeat(refresh_events,1))
		
	}
}

var SSD_congruent_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "SSD_setup"
	},
	questions: [
		[
			"<p class = center-block-text>SSD (c):</p>"
		]
	], on_finish: function(data) {
		SSD = parseInt(data.responses.slice(7, 10))
		SSD_congruent = Math.max(100, Math.min(400,SSD))
		SSD_incongruent = SSD_congruent
	}
}

var SSD_incongruent_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "SSD_setup"
	},
	questions: [
		[
			"<p class = center-block-text>SSD (i):</p>"
		]
	], on_finish: function(data) {
		SSD = parseInt(data.responses.slice(7, 10))
		SSD_incongruent = Math.max(100, Math.min(400,SSD))
	}
}

// var practiceTrials = []
// practiceTrials.push(feedback_block)
// practiceTrials.push(instructions_block)
// for (i = 0; i < practice_len; i++) {
// 	var fixation_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_fixation"
// 		},
// 		timing_response: 500, //500
// 		timing_post_trial: 0,
// 		prompt: prompt_text
// 	}
	
// 	var practice_block = {
// 		type: 'stop-signal',
// 		stimulus: getStim,
// 		SS_stimulus: getStopStim,
// 		SS_trial_type: getSSType, //getSSType,
// 		data: {
// 			"trial_id": "practice_trial"
// 		},
// 		is_html: true,
// 		choices: [possible_responses[0][1],possible_responses[1][1]],
// 		timing_stim: 1000,
// 		timing_response: 2000, //2000
// 		response_ends_trial: false,
// 		SSD: getSSD,
// 		timing_SS: 500, //500
// 		timing_post_trial: 0,
// 		on_finish: appendData,
// 		prompt: prompt_text,
// 		on_start: function(){
// 			stoppingTracker = []
// 			stoppingTimeTracker = []
// 		}
// 	}
	
// 	var categorize_block = {
// 		type: 'poldrack-single-stim',
// 		data: {
// 			trial_id: "practice-stop-feedback"
// 		},
// 		choices: 'none',
// 		stimulus: getCategorizeFeedback,
// 		timing_post_trial: 0,
// 		is_html: true,
// 		timing_stim: 500,
// 		timing_response: 500, //500
// 		response_ends_trial: false,

// 	};
// 	practiceTrials.push(fixation_block)
// 	practiceTrials.push(practice_block)
// 	practiceTrials.push(categorize_block)
// }


// var practiceCount = 0
// var practiceNode = {
// 	timeline: practiceTrials,
// 	loop_function: function(data){
// 		practiceCount += 1
// 		stims = createTrialTypes(numTrialsPerBlock)
// 		current_trial = 0
	
// 		var total_trials = 0
// 		var sum_responses = 0
// 		var total_sum_rt = 0
		
// 		var go_trials = 0
// 		var go_correct = 0
// 		var go_rt = 0
// 		var sum_go_responses = 0
		
// 		var stop_trials = 0
// 		var stop_correct = 0
// 		var stop_rt = 0
// 		var sum_stop_responses = 0
		
	
// 		for (var i = 0; i < data.length; i++){
// 			if ((data[i].trial_id == "practice_trial") && (data[i].stop_signal_condition == 'go')){
// 				total_trials+=1
// 				go_trials+=1
// 				if (data[i].rt != -1){
// 					total_sum_rt += data[i].rt
// 					go_rt += data[i].rt
// 					sum_go_responses += 1
// 					if (data[i].key_press == data[i].correct_response){
// 						go_correct += 1
		
// 					}
// 				}
		
// 			} else if ((data[i].trial_id == "practice_trial") && (data[i].stop_signal_condition == 'stop')){
// 				total_trials+=1
// 				stop_trials+=1
// 				if (data[i].rt != -1){
// 					total_sum_rt += data[i].rt
// 					stop_rt += data[i].rt
// 					sum_stop_responses += 1
// 				}
// 				if (data[i].key_press == -1){
// 					stop_correct += 1
	
// 				}
				
			
// 			}
	
// 		}
	
// 		var accuracy = go_correct / go_trials
// 		var missed_responses = (go_trials - sum_go_responses) / go_trials
// 		var ave_rt = go_rt / sum_go_responses
// 		var stop_acc = stop_correct / stop_trials
	
// 		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue."
// 		if (practiceCount == practice_thresh){
// 			feedback_text +=
// 				'</p><p class = block-text>Done with this practice.' 
// 				stims = createTrialTypes(numTrialsPerBlock)
// 				return false
// 		}
		
// 		if ((accuracy > accuracy_thresh) && (stop_acc < maxStopCorrectPractice) && (stop_acc > minStopCorrectPractice)){
// 			feedback_text +=
// 					'</p><p class = block-text>Done with this practice. Press Enter to continue.' 
// 			stims = createTrialTypes(numTrialsPerBlock)
// 			return false
	
// 		} else {
// 			if (accuracy < accuracy_thresh){
// 			feedback_text +=
// 					'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + prompt_text 
// 			}
// 			if (missed_responses > missed_thresh){
// 			feedback_text +=
// 					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
// 			}

// 	      	if (ave_rt > rt_thresh){
// 	        	feedback_text += 
// 	            	'</p><p class = block-text>You have been responding too slowly.'
// 	      	}
			
// 			if (stop_acc === maxStopCorrectPractice){
// 			feedback_text +=
// 				'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
			
// 			}
			
// 			if (stop_acc === minStopCorrectPractice){
// 			feedback_text +=
// 				'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
			
// 			}
		
			
// 			feedback_text +=
// 				'</p><p class = block-text>Redoing this practice. Press Enter to continue.' 
// 			stims = createTrialTypes(practice_len)
// 			return true
		
// 		}
	
// 	}
	
// }

var refreshTrials = []
refreshTrials.push(refresh_feedback_block)
for (i = 0; i < refresh_len; i++) {
	var refresh_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "practice_fixation"
		},
		timing_response: 500,
		timing_post_trial: 0,
		prompt: getPromptText,
		on_finish: shiftStim,
	}

	var refresh_block = {
		type: 'stop-signal',
		stimulus: getStim,
		SS_stimulus: getStopStim,
		SS_trial_type: getSSType, //getSSType,
		data: {
			"trial_id": "practice_trial"
		},
		is_html: true,
		choices: getChoices,
		timing_stim: 1000,
		timing_response: 2000, //2000
		response_ends_trial: false,
		SSD: getSSD,
		timing_SS: 500, //500
		timing_post_trial: 0,
		on_finish: appendData,
		prompt: getPromptText,
		on_start: function(){
			stoppingTracker = []
			stoppingTimeTracker = []
		}
	}
	
	var categorize_block = {
		type: 'poldrack-single-stim',
		data: {
			trial_id: "practice-stop-feedback"
		},
		choices: 'none',
		stimulus: getCategorizeFeedback,
		timing_post_trial: 0,
		is_html: true,
		timing_stim: 500,
		timing_response: 500, //500
		response_ends_trial: false,

	};
	refreshTrials.push(refresh_fixation_block)
	refreshTrials.push(refresh_block)
	refreshTrials.push(categorize_block)
}


var refreshCount = 0
var refreshNode = {
	timeline: refreshTrials,
	loop_function: function(data){
		refreshCount += 1
		// stims = createTrialTypes(numTrialsPerBlock)
		current_trial = 0
	
		var total_trials = 0
		var total_sum_rt = 0
		
		var go_trials = 0
		var go_correct = 0
		var go_rt = 0
		var sum_go_responses = 0
		
		var stop_trials = 0
		var stop_correct = 0
		var stop_rt = 0
		var sum_stop_responses = 0
		
	
		for (var i = 0; i < data.length; i++){
			if ((data[i].trial_id == "practice_trial") && (data[i].stop_signal_condition == 'go')){
				total_trials+=1
				go_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					go_rt += data[i].rt
					sum_go_responses += 1
					if (data[i].key_press == data[i].correct_response){
						go_correct += 1
		
					}
				}
		
			} else if ((data[i].trial_id == "practice_trial") && (data[i].stop_signal_condition == 'stop')){
				total_trials+=1
				stop_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					stop_rt += data[i].rt
					sum_stop_responses += 1
				}
				if (data[i].key_press == -1){
					stop_correct += 1
	
				}
				
			
			}
	
		}
	
		var accuracy = go_correct / go_trials
		var missed_responses = (go_trials - sum_go_responses) / go_trials
		var ave_rt = go_rt / sum_go_responses
		var stop_acc = stop_correct / stop_trials
	
		refresh_feedback_text = "<br>Please take this time to read your feedback and to take a short break!"

		refresh_feedback_text +=
				'</p><p class = block-text>Done with this practice.' 
		
	
		if (accuracy < accuracy_thresh){
			refresh_feedback_text +=
				'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + getPromptText()
		}
		if (missed_responses > missed_thresh){
			refresh_feedback_text +=
				'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

		if (ave_rt > rt_thresh){
			refresh_feedback_text += 
				'</p><p class = block-text>You have been responding too slowly.'
		}
		
		if (stop_acc === maxStopCorrectPractice){
			refresh_feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_acc === minStopCorrectPractice){
			refresh_feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}

		stims = createTrialTypes(numTrialsPerBlock, des_events)
		return false

	}
	
}
// TESTPHASE
var testCount = 0

// First block - no initialy feedback block
var testTrials0 = []
for (i = 0; i < numTrialsPerBlock; i++) {
	
	var test_block = {
		type: 'stop-signal',
		stimulus: getStim,
		SS_stimulus: getStopStim,
		SS_trial_type: getSSType,
		data: {
			"trial_id": "test_trial"
		},
		is_html: true,
		choices: getChoices,
		timing_stim: 1000,
		timing_response: 2000, //2000
		response_ends_trial: false,
		SSD: getSSD,
		timing_SS: 500, //500
		timing_post_trial: 0,
		fixation_default: true,
		on_finish: appendData,
		on_start: function(){
			stoppingTracker = []
			stoppingTimeTracker = []
		}
	}
	testTrials0.push(fixation_block)
	testTrials0.push(test_block)
}

var testNode0 = {
	timeline: testTrials0,
	loop_function: function(data) {
		testCount += 1
		
		current_trial = 0
	
		var total_trials = 0
		var total_sum_rt = 0
	
		var go_trials = 0
		var go_correct = 0
		var go_rt = 0
		var sum_go_responses = 0
	
		var stop_trials = 0
		var stop_correct = 0
		var stop_rt = 0
		var sum_stop_responses = 0
	

		for (var i = 0; i < data.length; i++){
			if ((data[i].trial_id == "test_trial") && (data[i].stop_signal_condition == 'go')){
				total_trials+=1
				go_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					go_rt += data[i].rt
					sum_go_responses += 1
					if (data[i].key_press == data[i].correct_response){
						go_correct += 1
	
					}
				}
	
			} else if ((data[i].trial_id == "test_trial") && (data[i].stop_signal_condition == 'stop')){
				total_trials+=1
				stop_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					stop_rt += data[i].rt
					sum_stop_responses += 1
				}
				if (data[i].key_press == -1){
					stop_correct += 1

				}		
			}
		}

		var accuracy = go_correct / go_trials
		var missed_responses = (go_trials - sum_go_responses) / go_trials
		var ave_rt = go_rt / sum_go_responses
		var stop_acc = stop_correct / stop_trials
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break!"
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptText()
		}
		
		if (missed_responses > missed_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly.'
      	}
		
		if (stop_acc > maxStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_acc < minStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}
	
		stims = createTrialTypes(numTrialsPerBlock, des_events)
		return false
		
	
	}
}

// Remaining blocks
var testTrials = []
testTrials.push(feedback_block)
for (i = 0; i < numTrialsPerBlock; i++) {
	
	var test_block = {
		type: 'stop-signal',
		stimulus: getStim,
		SS_stimulus: getStopStim,
		SS_trial_type: getSSType,
		data: {
			"trial_id": "test_trial"
		},
		is_html: true,
		choices: getChoices,
		timing_stim: 1000,
		timing_response: 2000, //2000
		response_ends_trial: false,
		SSD: getSSD,
		timing_SS: 500, //500
		timing_post_trial: 0,
		fixation_default: true,
		on_finish: appendData,
		on_start: function(){
			stoppingTracker = []
			stoppingTimeTracker = []
		}
	}
	testTrials.push(fixation_block)
	testTrials.push(test_block)
}

var testNode = {
	timeline: testTrials,
	loop_function: function(data) {
		testCount += 1
		
		current_trial = 0
	
		var total_trials = 0
		var total_sum_rt = 0
	
		var go_trials = 0
		var go_correct = 0
		var go_rt = 0
		var sum_go_responses = 0
	
		var stop_trials = 0
		var stop_correct = 0
		var stop_rt = 0
		var sum_stop_responses = 0
	

		for (var i = 0; i < data.length; i++){
			if ((data[i].trial_id == "test_trial") && (data[i].stop_signal_condition == 'go')){
				total_trials+=1
				go_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					go_rt += data[i].rt
					sum_go_responses += 1
					if (data[i].key_press == data[i].correct_response){
						go_correct += 1
	
					}
				}
	
			} else if ((data[i].trial_id == "test_trial") && (data[i].stop_signal_condition == 'stop')){
				total_trials+=1
				stop_trials+=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					stop_rt += data[i].rt
					sum_stop_responses += 1
				}
				if (data[i].key_press == -1){
					stop_correct += 1

				}		
			}
		}

		var accuracy = go_correct / go_trials
		var missed_responses = (go_trials - sum_go_responses) / go_trials
		var ave_rt = go_rt / sum_go_responses
		var stop_acc = stop_correct / stop_trials
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break!"
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptText()
		}
		
		if (missed_responses > missed_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly.'
      	}
		
		if (stop_acc > maxStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_acc < minStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}
	
		if (testCount == numTestBlocks){
			feedback_text +=
					'</p><p class = block-text>Done with this test.'
			return false
		} else {
			stims = createTrialTypes(numTrialsPerBlock, des_events)
			return true
		}
	
	}
}



/* create experiment definition array */
stop_signal_with_flanker__fmri_experiment = []

stop_signal_with_flanker__fmri_experiment.push(design_setup_block) //exp_input
stop_signal_with_flanker__fmri_experiment.push(motor_setup_block) //exp_input
stop_signal_with_flanker__fmri_experiment.push(SSD_congruent_setup_block) //exp_input
stop_signal_with_flanker__fmri_experiment.push(SSD_incongruent_setup_block) //exp_input


// stop_signal_with_flanker__fmri_experiment.push(practiceNode)
// stop_signal_with_flanker__fmri_experiment.push(feedback_block)

// test_keys(stop_signal_with_flanker__fmri_experiment, [possible_responses[0][1], possible_responses[1][1]])
stop_signal_with_flanker__fmri_experiment.push(refreshNode)
stop_signal_with_flanker__fmri_experiment.push(refresh_feedback_block)


cni_bore_setup(stop_signal_with_flanker__fmri_experiment)
stop_signal_with_flanker__fmri_experiment.push(testNode0)
stop_signal_with_flanker__fmri_experiment.push(testNode)
stop_signal_with_flanker__fmri_experiment.push(feedback_block)

stop_signal_with_flanker__fmri_experiment.push(end_block)
