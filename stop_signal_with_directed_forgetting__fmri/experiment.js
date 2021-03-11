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
}

function getITI_resp() { //added for fMRI compatibility
	var currITI = ITIs_resp.shift()
	if (currITI == 0.0) {
		currITI = 0.1
	}
	return currITI
}

//added for motor counterbalancing
function getMotorPerm() {
	return motor_perm
}

function getPossibleResponses() {
	if (getMotorPerm()==0) {
		return possible_responses
	} else if (getMotorPerm()==1) {
		return [possible_responses[1], possible_responses[0]]
	}
}



function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'stop_signal_with_directed_forgetting__fmri'})
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
	choice_counts[77] = 0
	choice_counts[90] = 0
	
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
			} else if ((experiment_data[i].stop_signal_condition == 'go') && (experiment_data[i].rt == -1)){
				missed_count += 1
			}
		}
	}
	
	
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
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


var getFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + feedback_text + '</p></div></div>'
}

var getRefreshFeedback = function() {
	if (getRefreshTrialID()=='instructions') {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white"><div class = instructbox>'+
		'<p class = instruct-text>In this experiment you will be presented with '+numLetters+' letters on each trial. There will be '+numLetters/2+' at the top and '+numLetters/2+' on the bottom. You must memorize all '+numLetters+' letters.</p> '+
		'<p class = instruct-text>There will be a short delay, then you will see a cue, either <i>TOP</i> or <i>BOT</i>. '+
		'This will instruct you to <i>FORGET</i> the '+numLetters/2+' letters located at either the top or bottom (respectively) of the screen.</p>'+
		'<p class = instruct-text>The '+numLetters/2+' remaining letters that you must remember are called your <i>MEMORY SET</i>. Please forget the letters not in the memory set.</p>'+
		'<p class = instruct-text>So for example, if you get the cue TOP, please <i>forget the top '+numLetters/2+' letters</i> and remember the bottom '+numLetters/2+' letters. <i>The bottom '+numLetters/2+' letters would be your MEMORY SET.</i></p>'+
		'<p class = instruct-text>After a short delay, you will be presented with a probe — a single letter.  Please indicate whether this probe was in your memory set.</p>'+
		'<p class = instruct-text>Press the <i>'+getPossibleResponses()[0][0]+
		' </i>if the probe was in the memory set, and the <i>'+getPossibleResponses()[1][0]+'  </i>if not.</p>'+
		'<p class = instruct-text>On some trials, a star will appear around the probe.  The star will appear with, or shortly after the probe appears.</p>'+
		'<p class = instruct-text>If you see a star appear, please try your best to make no response on that trial.</p>'+
		'<p class = instruct-text>If the star appears on a trial, and you try your best to withhold your response, you will find that you will be able to stop sometimes but not always.</p>'+
		'<p class = instruct-text>Please do not slow down your response to the probe in order to wait for the star.  Continue to respond as quickly and accurately as possible.</p>'+
		'<p class = instruct-text>During practice, you will see a reminder of the rules.  <i> This will be removed for the test</i>. </p>'+ 
		'<p class = instruct-text>To let the experimenters know when you are ready to begin, please press any button. </p>'+
		'</div>' + '</font></p></div></div>'

	} else {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white">' + feedback_text + '</font></p></div></div>'
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


var getCategorizeFeedback = function(){
	curr_trial = jsPsych.progress().current_trial_global - 2
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	if ((trial_id == 'practice_trial') && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition != 'stop')){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + prompt_text
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1)){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>' + prompt_text
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>' + prompt_text
	
		}
	} else if ((trial_id == 'practice_trial') && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop')){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).rt == -1){
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' + prompt_text
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).rt != -1){
			return '<div class = fb_box><div class = center-text><font size = 20>There was a star.</font></div></div>' + prompt_text
		}
	}
}

var randomDraw = function(lst) {
  var index = Math.floor(Math.random() * (lst.length))
  return lst[index]
}
							 
var createTrialTypes = function(numTrialsPerBlock, des_events){
	
	var stims = []
	for(var numIterations = 0; numIterations < numTrialsPerBlock; numIterations++){
		event_str = des_events.shift()
		
		if (event_str.includes('stop')){
			stop_signal_condition = 'stop'
		} else {
			stop_signal_condition = 'go'
		}

		if (event_str.includes('pos')){
			directed_condition = 'pos'
		} else if (event_str.includes('neg')) {
			directed_condition = 'neg'
		} else {
			directed_condition = 'con'
		}
		
		stim = {
			stop_signal_condition: stop_signal_condition,
			directed_condition: directed_condition
		}
		
		stims.push(stim)
	}
		
	new_len = stims.length
	new_stims = []
	var used_letters = []
	
	for (var i = 0; i < new_len; i++){
		stim = stims.shift()
		stop_signal_condition = stim.stop_signal_condition
		directed_condition = stim.directed_condition

		var letters = getTrainingSet(used_letters,numLetters)
		var cue = getCue()
		var probe = getProbe(directed_condition, letters, cue)
		var correct_response = getCorrectResponse(directed_condition, stop_signal_condition)
		 if (stop_signal_condition == 'go'){
			probe_color = 'green'
		 } else {
			probe_color = 'red'
		 }
		
		stim = {
			stop_signal_condition: stop_signal_condition,
			directed_condition: directed_condition,
			letters: letters,
			cue: cue,
			probe: probe,
			probe_color: probe_color,
			correct_response: correct_response
			}
	
		new_stims.push(stim)
		
		used_letters = used_letters.concat(letters)
		
	}	
	return new_stims
		
}


//this is an algorithm to choose the training set based on rules of the game (training sets are composed of any letter not presented in the last two training sets)
var getTrainingSet = function(used_letters, numLetters) {
	
	var trainingArray = jsPsych.randomization.repeat(stimArray, 1);
	var letters = trainingArray.filter(function(y) {
		
		return (jQuery.inArray(y, used_letters.slice(-numLetters*2)) == -1)
	}).slice(0,numLetters)
	
	return letters
};

//returns a cue randomly, either TOP or BOT
var getCue = function() {
	
	cue = directed_cue_array[Math.floor(Math.random() * 2)]
	
	return cue
};

// Will pop out a probe type from the entire probeTypeArray and then choose a probe congruent with the probe type
var getProbe = function(directed_cond, letters, cue) {
	var trainingArray = jsPsych.randomization.repeat(stimArray, 1);
	var lastCue = cue
	var lastSet_top = letters.slice(0,numLetters/2)
	var lastSet_bottom = letters.slice(numLetters/2)
	if (directed_cond== 'pos') {
		if (lastCue == 'BOT') {
			probe = lastSet_top[Math.floor(Math.random() * numLetters/2)]
		} else if (lastCue == 'TOP') {
			probe = lastSet_bottom[Math.floor(Math.random() * numLetters/2)]
		}
	} else if (directed_cond == 'neg') {
		if (lastCue == 'BOT') {
			probe = lastSet_bottom[Math.floor(Math.random() * numLetters/2)]
		} else if (lastCue == 'TOP') {
			probe = lastSet_top[Math.floor(Math.random() * numLetters/2)]
		}
	} else if (directed_cond == 'con') {
		newArray = trainingArray.filter(function(y) {
			return (y != lastSet_top[0] && y != lastSet_top[1] && 
					y != lastSet_bottom[0] && y != lastSet_bottom[1])
		})
		probe = newArray.pop()
	}
	
	
	return probe
};

var getCorrectResponse = function(directed_condition,stop_signal_condition) {
	if (stop_signal_condition == 'stop'){
		correct_response = -1
		return correct_response 
	}
	
	if (directed_condition == 'pos') {
		return getPossibleResponses()[0][1]
	} else if (directed_condition == 'neg') {
		return getPossibleResponses()[1][1]
	} else if (directed_condition == 'con') {
		return getPossibleResponses()[1][1]
	}
	
		
}

function getSSD(){
	return SSD
}

function getSSType(){
	return stop_signal_condition

}

var getStopStim = function(){
	return stop_signal_boards[0] + 
		   	preFileType + 'stopSignal' + fileTypePNG + 
		   stop_signal_boards[1] 
}



var appendData = function(){
	curr_trial = jsPsych.progress().current_trial_global
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	
	if (trial_id == 'practice_trial'){
		current_block = practiceCount
	}else{
		current_block = testCount
	}
	
	current_trial+=1
	
	var lastSet_top = letters.slice(0,numLetters/2)
	var lastSet_bottom = letters.slice(numLetters/2)
	
	jsPsych.data.addDataToLastTrial({
		stop_signal_condition: stop_signal_condition,
		directed_forgetting_condition: directed_condition,
		probe: probe,
		cue: cue,
		correct_response: correct_response,
		current_trial: current_trial,
		current_block: current_block,
		top_stim: lastSet_top,
		bottom_stim: lastSet_bottom
		
	})
	
	
	if ((trial_id == 'test_trial') || (trial_id == 'practice_trial')){
		if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD < maxSSD)){
			jsPsych.data.addDataToLastTrial({stop_acc: 1})
			SSD+=50
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1) && (jsPsych.data.getDataByTrialIndex(curr_trial).stop_signal_condition == 'stop') && (SSD > minSSD)){
			jsPsych.data.addDataToLastTrial({stop_acc: 0})
			SSD-=50
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

var getNextStim = function(){
	stim = stims.shift()
	stop_signal_condition = stim.stop_signal_condition
	directed_condition = stim.directed_condition
	probe = stim.probe
	letters = stim.letters
	cue = stim.cue
	correct_response = stim.correct_response
	
	return stim
}

var getTrainingStim = function(){
	return task_boards[0]+ preFileType + letters[0] + fileTypePNG +
		   task_boards[1]+
		   task_boards[2]+ preFileType + letters[1] + fileTypePNG +
		   task_boards[3]+ preFileType + letters[2] + fileTypePNG +
		   task_boards[4]+
		   task_boards[5]+ preFileType + letters[3] + fileTypePNG +
		   task_boards[6]
}

var getDirectedCueStim = function(){
	return '<div class = bigbox><div class = centerbox><div class = cue-text>'+ preFileType + cue + fileTypePNG +'</font></div></div></div>'	
}

var getProbeStim = function(){
	return '<div class = bigbox><div class = centerbox><div class = cue-text>'+ preFileType + probe + fileTypePNG +'</font></div></div></div>'
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
var practice_len = 12 // 12 must be divisible by 12, [3 (go,go,stop) by 4 (directed_forgetting conditions)]
var refresh_len = 12
var exp_len = 144 //180 must be divisible by 12
var numTrialsPerBlock = 48; // 36 divisible by 12
var numTestBlocks = exp_len / numTrialsPerBlock

var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_thresh = 0.10
var practice_thresh = 3 // 3 blocks of 28 trials
var numLetters = 4

var maxStopCorrect = 0.70
var minStopCorrect = 0.30

var maxStopCorrectPractice = 1
var minStopCorrectPractice = 0

var SSD = 350
var maxSSD = 1000
var minSSD = 0 
 
var possible_responses = [['index finger', 89], ['middle finger', 71]] 

var current_trial = 0
var current_block = 0

var stimArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
	'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

var directed_cond_array = ['pos', 'pos', 'neg', 'con']
var directed_cue_array = ['TOP','BOT']
var stop_signal_conditions = ['go','go','stop']

var fileTypePNG = '.png"></img>'
var preFileType = '<img class = center src="/static/experiments/stop_signal_with_directed_forgetting__fmri/images/'




var task_boards = [['<div class = bigbox><div class = topLeft><div class = cue-text>'],['</div></div><div class = topMiddle><div class = cue-text>'],['</div></div><div class = topRight><div class = cue-text>'],['</div></div><div class = bottomLeft><div class = cue-text>'],['</div></div><div class = bottomMiddle><div class = cue-text>'],['</div></div><div class = bottomRight><div class = cue-text>'],['</div></div></div>']]

var stop_signal_boards = ['<div class = bigbox><div class = starbox>','</div></div>']


// var stims = createTrialTypes(practice_len)


var prompt_text_list = '<ul style = "text-align:left">'+
						'<li>Please respond if the probe was in the memory set.</li>'+
						'<li>In memory set: ' + getPossibleResponses()[0][0] + '</li>' +
						'<li>Not in memory set: ' + getPossibleResponses()[1][0] + '</li>' +
						'<li>Do not respond if a star appears around the probe!</li>' +
					   '</ul>'

var prompt_text = '<div class = prompt_box>'+
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">Please respond if the probe was in the memory set.</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">In memory set: ' + getPossibleResponses()[0][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">Not in memory set: ' + getPossibleResponses()[1][0] + '</p>' +
					  '<p class = center-block-text style = "font-size:16px; line-height:80%%;">Do not respond if a star appears around the probe!</p>' +
				  '</div>'
				  
var pathSource = "/static/experiments/stop_signal_with_directed_forgetting__fmri/images/"
var pathDesignSource = "/static/experiments/stop_signal_with_directed_forgetting__fmri/designs/" //ADDED FOR fMRI SEQUENCES

var images = []
for(i=0;i<stimArray.length;i++){
	images.push(pathSource + stimArray[i] + '.png')
}
images.push(pathSource + 'stopSignal.png')
images.push(pathSource + 'TOP.png')
images.push(pathSource + 'BOT.png')
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
var directed_cond_array = ['pos', 'pos', 'neg', 'con']
var directed_cue_array = ['TOP','BOT']
var stop_signal_conditions = ['go','go','stop']
var refresh_events = ['go_pos', 'go_pos', 'go_pos', 'go_pos',
					  'go_neg', 'go_neg', 'go_con', 'go_con',
					  'stop_pos', 'stop_pos', 'stop_neg', 'stop_con']
/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */


var feedback_text = 
	'Welcome to the experiment. This experiment will take about 30 minutes. Press <i>enter</i> to begin.'

// var practice_feedback_block = {
// 	type: 'poldrack-single-stim',
// 	data: {
// 		trial_id: "feedback_block"
// 	},
// 	choices: [32],
// 	stimulus: getFeedback,
// 	timing_post_trial: 0,
// 	is_html: true,
// 	timing_response: 180000,
// 	response_ends_trial: true, 

// };
var refresh_feedback_block = {
	type: 'poldrack-single-stim',
	stimulus: getRefreshFeedback,
	data: {
		trial_id: getRefreshTrialID
	},
	choices: [32],

	timing_post_trial: 0,
	is_html: true,
	timing_response: getRefreshFeedbackTiming, //10 seconds for feedback
	timing_stim: getRefreshFeedbackTiming,
	response_ends_trial: getRefreshResponseEnds,
	on_finish: function() {
		refresh_trial_id = "practice-no-stop-feedback"
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


/* This function defines stopping criteria */
var end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
	},
	timing_response: 10000,
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p><p class = center-block-text>Press <i>enter</i> to continue.</p></div>',
	cont_key: [32],
	timing_post_trial: 0,
	on_finish: function(){
  	assessPerformance()
  }
};

var fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "fixation"
	},
	timing_post_trial: 0,
	timing_stim: 2000, //2000
	timing_response: 2000 //2000
}

var ITI_fixation_block = {
	type: 'poldrack-single-stim',
	is_html: true,
	choices: [possible_responses[0][1],possible_responses[1][1]],
	data: {
		trial_id: "ITI_fixation"
	},
	timing_post_trial: 0,
	timing_stim: getITI_stim, //1000
	timing_response: getITI_resp, //1000
	on_finish: function(){
		stim = getNextStim()
	}
}

var cue_directed_block = {
	type: 'poldrack-single-stim',
	stimulus: getDirectedCueStim,
	is_html: true,
	data: {
		trial_id: "cue",
	},
	choices: false,
	timing_post_trial: 0,
	timing_stim: 1000, //1000
	timing_response: 1000 //1000
};


var training_block = {
	type: 'poldrack-single-stim',
	stimulus: getTrainingStim,
	is_html: true,
	data: {
		trial_id: "stim"
	},
	choices: 'none',
	timing_post_trial: 0,
	timing_stim: 2000, //2000
	timing_response: 2000 //2000
};


var test_probe_block = {
	type: 'stop-signal',
	stimulus: getProbeStim,
	SS_stimulus: getStopStim,
	SS_trial_type: getSSType, //getSSType,
	data: {
		"trial_id": "test_trial"
	},
	is_html: true,
	choices: [possible_responses[0][1],possible_responses[1][1]],
	timing_stim: 1000,
	timing_response: 2000, //2000
	response_ends_trial: false,
	SSD: getSSD,
	timing_SS: 500, //500
	timing_post_trial: 0,
	on_finish: appendData,
	fixation_default: true,
	on_start: function(){
		stoppingTracker = []
		stoppingTimeTracker = []
	}
}

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
		design_perm =parseInt(data.responses.slice(7, 10))
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
		stims = createTrialTypes(refresh_len, jsPsych.randomization.repeat(refresh_events,refresh_len/refresh_events.length))
	}
}

var SSD_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "SSD_setup"
	},
	questions: [
		[
			"<p class = center-block-text>SSD:</p>"
		]
	], on_finish: function(data) {
		SSD = parseInt(data.responses.slice(7, 10))
		SSD = math.max(100,math.min(400,SSD))

	}
}



// var practiceTrials = []
// practiceTrials.push(feedback_block)
// practiceTrials.push(instructions_block)
// for (i = 0; i < practice_len; i++) { 
// 	var practice_start_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_fixation"
// 		},
// 		timing_post_trial: 0,
// 		timing_stim: 500, //500
// 		timing_response: 500, //500
// 		prompt: prompt_text,
// 		on_finish: function(){
// 			stim = getNextStim()
// 		}
// 	}

// 	var practice_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
// 		is_html: true,
// 		choices: 'none',
// 		data: {
// 			trial_id: "practice_fixation"
// 		},
// 		timing_post_trial: 0,
// 		prompt: prompt_text,
// 		timing_stim: 2000, //2000
// 		timing_response: 2000 //2000
// 	}

// 	var practice_ITI_fixation_block = {
// 		type: 'poldrack-single-stim',
// 		is_html: true,
// 		choices: [possible_responses[0][1],possible_responses[1][1]],
// 		data: {
// 			trial_id: "practice_ITI_fixation"
// 		},
// 		timing_post_trial: 0,
// 		prompt: prompt_text,
// 		timing_stim: 1000, //1000
// 		timing_response: 1000 //1000
// 	}

// 	var practice_cue_directed_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: getDirectedCueStim,
// 		is_html: true,
// 		data: {
// 			trial_id: "practice_cue",
// 		},
// 		choices: false,
// 		timing_post_trial: 0,
// 		timing_stim: 1000, //1000
// 		timing_response: 1000, //1000
// 		prompt: prompt_text,
// 	};


// 	var practice_training_block = {
// 		type: 'poldrack-single-stim',
// 		stimulus: getTrainingStim,
// 		is_html: true,
// 		data: {
// 			trial_id: "practice_stim"
// 		},
// 		choices: 'none',
// 		timing_post_trial: 0,
// 		prompt: prompt_text,
// 		timing_stim: 2000, //2000
// 		timing_response: 2000 //2000
// 	};


// 	var practice_probe_block = {
// 		type: 'stop-signal',
// 		stimulus: getProbeStim,
// 		SS_stimulus: getStopStim,
// 		SS_trial_type: getSSType, //getSSType,
// 		data: {
// 			"trial_id": "practice_trial"
// 		},
// 		is_html: true,
// 		choices: [possible_responses[0][1],possible_responses[1][1]],
// 		timing_stim: 1000,
// 		timing_response: 1000, //2000
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

// 	  };
// 	practiceTrials.push(practice_start_fixation_block)
// 	practiceTrials.push(practice_training_block)
// 	practiceTrials.push(practice_cue_directed_block)
// 	practiceTrials.push(practice_fixation_block)
// 	practiceTrials.push(practice_probe_block)
// 	practiceTrials.push(practice_ITI_fixation_block)
// 	practiceTrials.push(categorize_block)
// }

var practiceCount = 0
// var practiceNode = {
// 	timeline: practiceTrials,
// 	loop_function: function(data){
// 		stims = createTrialTypes(numTrialsPerBlock)
// 		practiceCount += 1
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
// 				total_trials +=1
// 				go_trials +=1
// 				if (data[i].rt != -1){
// 					total_sum_rt += data[i].rt
// 					go_rt += data[i].rt
// 					sum_go_responses += 1
// 					if (data[i].key_press == data[i].correct_response){
// 						go_correct += 1
		
// 					}
// 				}
		
// 			} else if ((data[i].trial_id == "practice_trial") && (data[i].stop_signal_condition == 'stop')){
// 				total_trials +=1
// 				stop_trials +=1
// 				if (data[i].rt != -1){
// 					total_sum_rt += data[i].rt
// 					stop_rt += data[i].rt
// 					sum_stop_responses += 1
// 				} else if (data[i].key_press == -1){
// 					stop_correct += 1
// 				}
				
			
// 			}
	
// 		}
	
// 		var accuracy = go_correct / go_trials
// 		var missed_responses = (go_trials - sum_go_responses) / go_trials
// 		var ave_rt = go_rt / sum_go_responses
// 		var stop_acc = stop_correct / stop_trials
	
// 		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"
		
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
// 			if (accuracy < accuracy_thresh) {
// 				feedback_text +=
// 						'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + prompt_text_list
// 			}
					
// 			if (missed_responses > missed_thresh){
// 				feedback_text +=
// 						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
// 			}

// 	      	if (ave_rt > rt_thresh){
// 	        	feedback_text += 
// 	            	'</p><p class = block-text>You have been responding too slowly.'
// 	      	}
			
// 			if (stop_correct === maxStopCorrectPractice){
// 				feedback_text +=
// 				'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
			
// 			}
			
// 			if (stop_correct === minStopCorrectPractice){
// 				feedback_text +=
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
var refresh_start_fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "practice_fixation"
	},
	timing_post_trial: 0,
	timing_stim: 500, //500
	timing_response: 500, //500
	prompt: prompt_text,
	on_finish: function(){
		stim = getNextStim()
	}
}

var refresh_fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation><span style="color:white">+</span></div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "practice_fixation"
	},
	timing_post_trial: 0,
	prompt: prompt_text,
	timing_stim: 2000, //2000
	timing_response: 2000 //2000
}

var refresh_ITI_fixation_block = {
	type: 'poldrack-single-stim',
	is_html: true,
	choices: [possible_responses[0][1],possible_responses[1][1]],
	data: {
		trial_id: "practice_ITI_fixation"
	},
	timing_post_trial: 0,
	prompt: prompt_text,
	timing_stim: 1000, //1000
	timing_response: 1000 //1000
}

var refresh_cue_directed_block = {
	type: 'poldrack-single-stim',
	stimulus: getDirectedCueStim,
	is_html: true,
	data: {
		trial_id: "practice_cue",
	},
	choices: false,
	timing_post_trial: 0,
	timing_stim: 1000, //1000
	timing_response: 1000, //1000
	prompt: prompt_text,
};


var refresh_training_block = {
	type: 'poldrack-single-stim',
	stimulus: getTrainingStim,
	is_html: true,
	data: {
		trial_id: "practice_stim"
	},
	choices: 'none',
	timing_post_trial: 0,
	prompt: prompt_text,
	timing_stim: 2000, //2000
	timing_response: 2000 //2000
};


var refresh_probe_block = {
	type: 'stop-signal',
	stimulus: getProbeStim,
	SS_stimulus: getStopStim,
	SS_trial_type: getSSType, //getSSType,
	data: {
		"trial_id": "practice_trial"
	},
	is_html: true,
	choices: [possible_responses[0][1],possible_responses[1][1]],
	timing_stim: 1000,
	timing_response: 1000, //2000
	response_ends_trial: false,
	SSD: getSSD,
	timing_SS: 500, //500
	timing_post_trial: 0,
	on_finish: appendData,
	prompt: prompt_text,
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

for (i = 0; i < refresh_len; i++) { 
	refreshTrials.push(refresh_start_fixation_block)
	refreshTrials.push(refresh_training_block)
	refreshTrials.push(refresh_cue_directed_block)
	refreshTrials.push(refresh_fixation_block)
	refreshTrials.push(refresh_probe_block)
	refreshTrials.push(refresh_ITI_fixation_block)
	refreshTrials.push(categorize_block)
}

var refreshCount = 0
var refreshNode = {
	timeline: refreshTrials,
	loop_function: function(data){
		refreshCount += 1
		current_trial = 0
	
		var total_trials = 0
		var sum_responses = 0
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
			if ((data[i].trial_id == "refresh_trial") && (data[i].stop_signal_condition == 'go')){
				total_trials +=1
				go_trials +=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					go_rt += data[i].rt
					sum_go_responses += 1
					if (data[i].key_press == data[i].correct_response){
						go_correct += 1
		
					}
				}
		
			} else if ((data[i].trial_id == "refresh_trial") && (data[i].stop_signal_condition == 'stop')){
				total_trials +=1
				stop_trials +=1
				if (data[i].rt != -1){
					total_sum_rt += data[i].rt
					stop_rt += data[i].rt
					sum_stop_responses += 1
				} else if (data[i].key_press == -1){
					stop_correct += 1
				}
				
			
			}
	
		}
	
		var accuracy = go_correct / go_trials
		var missed_responses = (go_trials - sum_go_responses) / go_trials
		var ave_rt = go_rt / sum_go_responses
		var stop_acc = stop_correct / stop_trials
	
		feedback_text = "</p><p class = block-text>Done with this practice. <br>Please take this time to read your feedback and to take a short break!"
		
	
		if (accuracy < accuracy_thresh) {
			feedback_text +=
					'</p><p class = block-text>Remember: <br>' + prompt_text_list
		}
				
		if (missed_responses > missed_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

		if (ave_rt > rt_thresh){
			feedback_text += 
				'</p><p class = block-text>You have been responding too slowly.'
		}
		
		if (stop_correct === maxStopCorrectPractice){
			feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_correct === minStopCorrectPractice){
			feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}
		
		
		stims = createTrialTypes(numTrialsPerBlock, des_events)
		return false
			
	
	}
	
}


// TEST TRIALS
var testCount = 0
var testTrials0 = []
for (i = 0; i < numTrialsPerBlock; i++) {
	testTrials0.push(ITI_fixation_block) //variable
	testTrials0.push(training_block) //2000
	testTrials0.push(cue_directed_block) //1000
	testTrials0.push(fixation_block) //2000
	testTrials0.push(test_probe_block) // 2000ms; timing_stim= 1000, timing_SS= 500, SSD: getSSD
}


var testNode0 = {
	timeline: testTrials0,
	loop_function: function(data) {
		testCount += 1
		current_trial = 0
	
		var total_trials = 0
		var sum_responses = 0
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
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + prompt_text_list
		}
		
		if (missed_responses > missed_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly.'
      	}
		
		if (stop_correct > maxStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_correct < minStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}
		stims = createTrialTypes(numTrialsPerBlock, des_events)
		return false
	
	}
}

var testTrials = []
testTrials.push(feedback_block)
for (i = 0; i < numTrialsPerBlock; i++) {
	testTrials.push(ITI_fixation_block) //variable
	testTrials.push(training_block) //2000
	testTrials.push(cue_directed_block) //1000
	testTrials.push(fixation_block) //2000
	testTrials.push(test_probe_block) // 2000ms; timing_stim= 1000, timing_SS= 500, SSD: getSSD
}


var testNode = {
	timeline: testTrials,
	loop_function: function(data) {
		testCount += 1
		current_trial = 0
	
		var total_trials = 0
		var sum_responses = 0
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
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + prompt_text_list
		}
		
		if (missed_responses > missed_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly.'
      	}
		
		if (stop_correct > maxStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have been responding too slowly.  Please respond as quickly and accurately to each stimulus that requires a response.'
		
		}
		
		if (stop_correct < minStopCorrect){
			feedback_text +=
			'</p><p class = block-text>You have not been stopping your response when stars are present.  Please try your best to stop your response if you see a star.'
		
		}
	
		if (testCount == numTestBlocks){
			feedback_text +=
					'</p><p class = block-text>Done with this test. Press Enter to continue.<br> If you have been completing tasks continuously for an hour or more, please take a 15-minute break before starting again.'
			return false
		} else {
			stims = createTrialTypes(numTrialsPerBlock, des_events)
			return true
		}
	
	}
}


/* create experiment definition array */
stop_signal_with_directed_forgetting__fmri_experiment = []

stop_signal_with_directed_forgetting__fmri_experiment.push(design_setup_block) //exp_input
stop_signal_with_directed_forgetting__fmri_experiment.push(motor_setup_block) //exp_input
stop_signal_with_directed_forgetting__fmri_experiment.push(SSD_setup_block) //exp_input

test_keys(stop_signal_with_directed_forgetting__fmri_experiment, [possible_responses[0][1], possible_responses[1][1]])


stop_signal_with_directed_forgetting__fmri_experiment.push(refreshNode)
stop_signal_with_directed_forgetting__fmri_experiment.push(refresh_feedback_block)

cni_bore_setup(stop_signal_with_directed_forgetting__fmri_experiment)
stop_signal_with_directed_forgetting__fmri_experiment.push(testNode0)
stop_signal_with_directed_forgetting__fmri_experiment.push(testNode)
stop_signal_with_directed_forgetting__fmri_experiment.push(feedback_block)

stop_signal_with_directed_forgetting__fmri_experiment.push(end_block)
