/* ************************************ */
/* Define helper functions */
/* ************************************ */

//added for motor counterbalancing
function getMotorPerm() {
	return motor_perm
}

function getStimTrials() {
    return trial_stim
}

function getStimTrials_1() { 
	return trial_stim_1
}

function getGlobal() { 
	correct_response = trial_stim.correct_response
	fixation = '<div class = centerbox><div class = fixation>+</div></div>'
	return fixation
}

function updateTrialsWithDesigns(options) { 
	var stims = [] 
	incongruent_trials = [] 
	congruent_trials = []
	for (var idx = 0; idx < options.length; idx++) { 
		if (options[idx].data['flanker_condition'] == 'incongruent') { 
			incongruent_trials.push(options[idx]) } 
		if (options[idx].data['flanker_condition'] == 'congruent') { 
			congruent_trials.push(options[idx]) } 
		} 
	curr_des_events = des_events.slice(0, numTrialsPerBlock) // grab this block's designs 
	des_events = des_events.slice(numTrialsPerBlock, )  // get rid of these designs in the list 
	for (var idx = 0; idx < curr_des_events.length; idx++) {
		flanker_condition = curr_des_events[idx]
		if (flanker_condition == 'incongruent') {
			stim = incongruent_trials[Math.floor(Math.random() * incongruent_trials.length)];
		}
		if (flanker_condition == 'congruent')  { 
			stim = congruent_trials[Math.floor(Math.random() * congruent_trials.length)];
		 } 
		stims.push(stim)
		}

	return stims
	}

//FUNCTIONS FOR GETTING FMRI SEQUENCES
function getdesignITIs(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/ITIs_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
} 
function getdesignEvents(design_num) {
	x = fetch(pathDesignSource+'design_'+design_num+'/events_clean.txt').then(res => res.text()).then(res => res).then(text => text.split(/\r?\n/));
	return x
}  

var possible_responses = [['index finger', 89],['middle finger', 71]]

function getTimeoutMessage() {
	return  '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>' 
	+ getPromptTextList() }

function getPossibleResponses() {
	if (getMotorPerm()==0) {
		return possible_responses
	} else if (getMotorPerm()==1) {
		return [['middle finger', 71],['index finger', 89]]
	}
}

function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'flanker_single_task_network__fmri'})
}

//Functions added for in-person sessions

function popRefreshAnswer() { 
	return practice_response_array.shift()

}
function genITIs() { 
	mean_iti = 0.5 //mean and standard deviation of 0.5 secs
	min_thresh = 0
	max_thresh = 4

	lambda = 1/mean_iti
	iti_array = []
	for (i=0; i < exp_len; i++) {
		curr_iti = - Math.log(Math.random()) / lambda;
		while (curr_iti > max_thresh || curr_iti < min_thresh) {
			curr_iti = - Math.log(Math.random()) / lambda;
		}
		iti_array.push(curr_iti*1000) //convert ITIs from seconds to milliseconds

	}
	return(iti_array)
}

function getITI_stim() { //added for fMRI compatibility
	var currITI = ITIs_stim.shift()
	if (currITI == 0.0) { //THIS IS JUST FOR CONVENIENCE BEFORE NEW DESIGNS ARE REGENERATED
		currITI = 0.1
	}
	return currITI
}

function getITI_resp() { //added for fMRI compatibility
	var currITI = ITIs_resp.shift()
	if (currITI == 0.0) { //THIS IS JUST FOR CONVENIENCE BEFORE NEW DESIGNS ARE REGENERATED
		currITI = 0.1
	}
	return currITI
}

function assessPerformance() {
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	var correct = 0
		//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	choice_counts[89] = 0
	choice_counts[71] = 0
	for (var k = 0; k < choices.length; k++) {
		choice_counts[choices[k]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].trial_id == 'test_trial') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
			
			if (key == experiment_data[i].correct_response){
				correct += 1
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
		if (choice_counts[key] > trial_count * 0.85) {
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

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

var getFeedback = function() {
	return '<div class = bigbox><div class = picture_box><p class = block-text><font color="white">' + feedback_text + '</font></p></div></div>'
}

var changeData = function() {
		data = jsPsych.data.getTrialsOfType('text')
		practiceDataCount = 0
		testDataCount = 0
		for (i = 0; i < data.length; i++) {
			if (data[i].trial_id == 'practice_intro') {
				practiceDataCount = practiceDataCount + 1
			} else if (data[i].trial_id == 'test_intro') {
				testDataCount = testDataCount + 1
			}
		}
		if (practiceDataCount >= 1 && testDataCount === 0) {
			//temp_id = data[i].trial_id
			jsPsych.data.addDataToLastTrial({
				exp_stage: "practice"
			})
		} else if (practiceDataCount >= 1 && testDataCount >= 1) {
			//temp_id = data[i].trial_id
			jsPsych.data.addDataToLastTrial({
				exp_stage: "test"
			})
		}
	}

var getRefreshFeedback = function() {
	if (getRefreshTrialID()=='instructions') {
		return '<div class = centerbox>'+
		"<p class = block-text>In this experiment you will see five letters on the string composed of F's and H's."+
		'Your task is to respond by pressing the key corresponding to the <b>middle</b> letter.</p>'+

		'<p class = block-text> If the middle letter is F, press the ' + getPossibleResponses()[1][0] + ' button. </p>' + 
		'<p class = block-text> If the middle letter is H, press the '+  getPossibleResponses()[0][0] + ' button. </p> ' + 
		'<p class = block-text>After each response you will get feedback about whether you were correct or not. We will start with a short practice set.</p>'+
		'</div>'

	} else {
		return '<div class = bigbox><div class = picture_box><p class = block-text><font color="white">' + refresh_feedback_text + '</font></p></div></div>'
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
function getPromptTextList() {
	return '<ul style="text-align:left;"><font color="white">'+
	'<li>F: ' + getPossibleResponses()[1][0] + '</li>' +
	'<li>H: ' + getPossibleResponses()[0][0] + '</li>' +
  '</font></ul>'

}

function getCorrectResponse(center_letter) { 
	correct_response = 0
	if (center_letter == 'F') { 
		correct_response = getPossibleResponses()[1][1] 
	}
	if (center_letter == 'H') { 
		correct_response = getPossibleResponses()[0][1]
	}
	return correct_response
	}

function returnStimuliOptions() { 
	test_stimuli = [{
		image: flanker_boards[0]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[1]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[2]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[3]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[4]+ preFileType + 'F' + fileTypePNG,
		data: {
			flanker_condition: 'incongruent',
			trial_id: 'stim',
			flanker: 'F',
			center_letter: 'H', 
			correct_response: getCorrectResponse('H')
		}
	}, {
		image: flanker_boards[0]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[1]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[2]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[3]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[4]+ preFileType + 'H' + fileTypePNG,
		data: {
			flanker_condition: 'incongruent',
			trial_id: 'stim',
			flanker: 'H',
			center_letter: 'F', 
			correct_response: getCorrectResponse('F')
		}
	}, {
		image: flanker_boards[0]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[1]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[2]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[3]+ preFileType + 'H' + fileTypePNG +
			   flanker_boards[4]+ preFileType + 'H' + fileTypePNG,
		data: {
			flanker_condition: 'congruent',
			trial_id: 'stim',
			flanker: 'H',
			center_letter: 'H',
			correct_response: getCorrectResponse('H')

		}
	}, {
		image: flanker_boards[0]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[1]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[2]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[3]+ preFileType + 'F' + fileTypePNG +
			   flanker_boards[4]+ preFileType + 'F' + fileTypePNG,
		data: {
			flanker_condition: 'congruent',
			trial_id: 'stim',
			flanker: 'F',
			center_letter: 'F',
			correct_response: getCorrectResponse('F')

		}
	}];
	return test_stimuli
}
	/* ************************************ */
	/* Define experimental variables */
	/* ************************************ */
	// generic task variables

var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds

var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_response_thresh = 0.10
var practice_thresh = 3 // 3 blocks of 12 trials
var choices = [71, 89]
// task specific variables
// var correct_responses = jsPsych.randomization.repeat([
// 	["middle finger", 71],
// 	["index finger", 89]
// ], 1)



var fileTypePNG = '.png"></img>'
var preFileType = '<img class = center src="/static/experiments/flanker_single_task_network__fmri/images/'
var flanker_boards = [['<div class = bigbox><div class = centerbox><div class = flankerLeft_2><div class = cue-text>'],['</div></div><div class = flankerLeft_1><div class = cue-text>'],['</div></div><div class = flankerMiddle><div class = cue-text>'],['</div></div><div class = flankerRight_1><div class = cue-text>'],['</div></div><div class = flankerRight_2><div class = cue-text>'],['</div></div></div></div>']]					   

var practice_len = 4 // must be divisible by 4
var exp_len = 144 // must be divisible by 4, 100 in original
var numTrialsPerBlock = 36 //must be divisible by 4
var numTestBlocks = exp_len / numTrialsPerBlock

//var practice_trials = jsPsych.randomization.repeat(test_stimuli, practice_len / 4, true);
var practice_trials = [] 
// var test_trials = jsPsych.randomization.repeat(test_stimuli, numTrialsPerBlock / 4, true);
// var practice_trials = createTrials(practice_len)
var practice_response_array = [];
var test_trials = [] 
// }

// var test_response_array = [];
// for (i = 0; i < test_trials.data.length; i++) {
// 	test_response_array.push(test_trials.data[i].correct_response)
// }

				  
//PRE LOAD IMAGES HERE
var pathSource = "/static/experiments/flanker_single_task_network__fmri/images/"
var pathDesignSource = "/static/experiments/flanker_single_task_network__fmri/designs/" //ADDED FOR fMRI SEQUENCES
var images = []

//ADDED FOR SCANNING
//fmri variables
var ITIs_stim = []
var ITIs_resp = []

var refresh_trial_id = "instructions"
var refresh_feedback_timing = -1
var refresh_response_ends = true

var motor_perm = 0

images.push(pathSource + 'F.png')
images.push(pathSource + 'H.png')
jsPsych.pluginAPI.preloadImages(images);
/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

var appendData = function(){
	curr_trial = jsPsych.progress().current_trial_global
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	current_trial+=1
	
	
	if (trial_id == 'practice_trial'){
		current_block = refreshCount
	} else if (trial_id == 'test_trial'){
		current_block = testCount
	}
		
	jsPsych.data.addDataToLastTrial({
		flanker_condition: flanker_condition,
		probe: probe,
		correct_response: correct_response,
		delay: delay,
		current_trial: current_trial,
		current_block: current_block,
		letter_case: letter_case
	})
		
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
/* define static blocks */
var feedback_instruct_text =
	'Welcome to the experiment. This experiment will take around 5 minutes. Press <i>enter</i> to begin.'
var feedback_instruct_block = {
	type: 'poldrack-text',
	cont_key: [32],
	data: {
		trial_id: "instruction"
	},
	text: getInstructFeedback,
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.

var end_block = {
	type: 'poldrack-text',
	timing_response: 180000,
	data: {
		trial_id: "end",
	},
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p>',
	cont_key: [32],
	timing_post_trial: 0,
	on_finish: function(){
		assessPerformance()
    }
};

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
		refresh_trial_id = "practice_feedback"
		refresh_feedback_timing = 10000
		refresh_response_ends = false
	} 

};

var refresh_fixation_block = {
	type: 'poldrack-single-stim',
	stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	is_html: true,
	choices: 'none',
	data: {
		trial_id: "practice_fixation"
	},
	timing_response: 500, //500
	timing_post_trial: 0,
	prompt: getPromptTextList
}


var feedback_text = 'The test will begin shortly'
var feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: "practice-no-stop-feedback"
	},
	choices: 'none',
	stimulus: getFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 10000,
	response_ends_trial: false, 

};
/********************************************/
/*				Set up nodes				*/
/********************************************/


/* ************************************ */
/*        Set up timeline blocks        */
/* ************************************ */
var des_ITIs = []
var des_events = [] 


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
		// des_trial_types = makeDesignTrialTypes(des_events)
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
		options = returnStimuliOptions();
		trial_stim = jsPsych.randomization.repeat(options, practice_len / 4, true);

		trial_stim_1 = JSON.parse(JSON.stringify(trial_stim))

		for (i = 0; i < trial_stim.data.length; i++) {
			practice_response_array.push(trial_stim.data[i].correct_response)
		}
	}
}
var correct_response = 0
var practiceCount = 0
var refreshTrials = []
refreshTrials.push(refresh_feedback_block)
for (i = 0; i < practice_len; i++) {

	var refresh_block = {
		type: 'poldrack-categorize',
		stimulus: function() { return getStimTrials().image.shift() }, 	
		is_html: true,
		key_answer: popRefreshAnswer, 
		correct_text: '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>', 
		incorrect_text: '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>', 
		timeout_message: getTimeoutMessage, 
		choices: [89, 71],
		data: function() { return getStimTrials().data.shift() }, 
		timing_feedback_duration: 500, //500
		timing_stim: 1000, //1000
		show_stim_with_feedback: false,
		response_ends_trial: false,
		timing_response: 2000, //2000
		timing_post_trial: 0,
		prompt: getPromptTextList,
		on_finish: function(data) {
			correct_trial = 0
			if (data.key_press == data.correct_response) {
				correct_trial = 1
			}
			current_block = practiceCount
		
			jsPsych.data.addDataToLastTrial({correct_trial: correct_trial,
											 trial_id: 'practice_trial',
											 current_block: current_block,
											 current_trial: i,
											 })
		}
	}
	
	refreshTrials.push(refresh_fixation_block)
	refreshTrials.push(refresh_block)
}

var refreshNode = {
	timeline: refreshTrials,
	loop_function: function(data) {	
		
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
		options = returnStimuliOptions();
		//curr_des_events = des_events.slice(0, numTrialsPerBlock) // grab this block's designs 
	// des_events = des_events.slice(numTrialsPerBlock, )
		trial_stim = updateTrialsWithDesigns(options)
		trial_stim_1 = JSON.parse(JSON.stringify(trial_stim))

		for (var i = 0; i < data.length; i++){
			if (data[i].trial_id == "practice_trial"){
				total_trials+=1
				if (data[i].rt != -1){
					sum_rt += data[i].rt
					sum_responses += 1
					if (data[i].key_press == data[i].correct_response){
						correct += 1
		
					}
				}
		
			}
	
		}
		var accuracy = correct / total_trials
		var missed_responses = (total_trials - sum_responses) / total_trials
		var ave_rt = sum_rt / sum_responses
	
		refresh_feedback_text = "<br><p class = block-text>Please take this time to read your feedback and to take a short break!</br></p>"
		if (accuracy > accuracy_thresh){
			
			refresh_feedback_text += '</p><p class = block-text>Done with this practice. The test session will begin shortly.' 
			//test_trials = jsPsych.randomization.repeat(test_stimuli, numTrialsPerBlock / 4, true);
			return false; 

		} if (accuracy < accuracy_thresh){
			refresh_feedback_text += '<p class = block-text>Remember:' + getPromptTextList()
			if (missed_responses > missed_response_thresh){
				refresh_feedback_text +=
						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	refresh_feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
			  }
		exp_phase = 'test'
	  
		return false

		}
		
	}
}


//in scanner test blocks
var testCount = 0
//first block skips intro feedback
var testTrials0 = []
for (i = 0; i < numTrialsPerBlock; i++) {
	var test_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
		is_html: true,
		data: {
			trial_id: "test_fixation"
		},
		choices: 'none',
		timing_stim: getITI_stim, //500 
		timing_response: getITI_resp, //500
		timing_post_trial: 0,
		on_finish: changeData,
	};

	var test_block = {
		type: 'poldrack-single-stim',
		stimulus: function() { return getStimTrials().shift().image }, 
		is_html: true,
		choices: [71, 89],
		data: function() { return getStimTrials_1().shift().data }, 
		feedback_duration: 0,
		timing_response: 2000, //2000
		timing_stim: 1000, //1000
		fixation_default: true,
		response_ends_trial: false,
		show_stim_with_feedback: false,
		timing_post_trial: 0,
		on_finish: function(data) {
			correct_trial = 0
			if (data.key_press == data.correct_response) {
				correct_trial = 1
			}
			
			current_block = testCount
			
			jsPsych.data.addDataToLastTrial({correct_trial: correct_trial,
											 trial_id: 'test_trial',
											 current_block: current_block,
											 current_trial: i
											 })
		}
	};
	
	testTrials0.push(test_fixation_block)
	testTrials0.push(test_block)
}

var testNode0 = {
	timeline: testTrials0,
	loop_function: function(data) {
		testCount += 1
		current_trial = 0 
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
		options = returnStimuliOptions();

		trial_stim = updateTrialsWithDesigns(options)
		trial_stim_1 = JSON.parse(JSON.stringify(trial_stim))
		for (var i = 0; i < data.length; i++){
			if (data[i].trial_id == 'test_trial') {
				total_trials+=1
				if (data[i].rt != -1){
					sum_rt += data[i].rt
					sum_responses += 1
					if (data[i].key_press == data[i].correct_response){
						correct += 1
		
					}
				}
		
			}
	
		}
	
		var accuracy = correct / total_trials
		var missed_responses = (total_trials - sum_responses) / total_trials
		var ave_rt = sum_rt / sum_responses

		feedback_text = "<br><p class = block-text>Please take this time to read your feedback and to take a short break."
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptTextList()
		}
		if (missed_responses > missed_response_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond to each shape as quickly and as accurately as possible.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly. Please respond to each shape as quickly and as accurately as possible.'
      	}
	
		
	}
}



var testTrials = []
testTrials.push(feedback_block)
for (i = 0; i < numTrialsPerBlock; i++) {
	var test_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
		is_html: true,
		data: {
			trial_id: "test_fixation"
		},
		choices: 'none',
		timing_stim: getITI_stim, //500 
		timing_response: getITI_resp, //500
		timing_post_trial: 0,
		on_finish: changeData,
	};
	
	var test_block = {
		type: 'poldrack-single-stim',
		stimulus: function() { return getStimTrials().shift().image }, 
		is_html: true,
		choices: [71, 89],
		data: function() { return getStimTrials_1().shift().data }, 
		feedback_duration: 0,
		timing_response: 2000, //2000
		timing_stim: 1000, //1000
		fixation_default: true,
		response_ends_trial: false,
		show_stim_with_feedback: false,
		timing_post_trial: 0,
		on_finish: function(data) {
			correct_trial = 0
			if (data.key_press == data.correct_response) {
				correct_trial = 1
			}
			
			current_block = testCount
			
			jsPsych.data.addDataToLastTrial({correct_trial: correct_trial,
											 trial_id: 'test_trial',
											 current_block: current_block,
											 current_trial: i
											 })
		}
	};
	
	testTrials.push(test_fixation_block)
	testTrials.push(test_block)
}

var testCount = 0
var testNode = {
	timeline: testTrials,
	loop_function: function(data) {
		testCount += 1
		current_trial = 0 
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
		options = returnStimuliOptions();

		trial_stim = updateTrialsWithDesigns(options)
		trial_stim_1 = JSON.parse(JSON.stringify(trial_stim))
		for (var i = 0; i < data.length; i++){
			if (data[i].trial_id == 'test_trial') {
				total_trials+=1
				if (data[i].rt != -1){
					sum_rt += data[i].rt
					sum_responses += 1
					if (data[i].key_press == data[i].correct_response){
						correct += 1
		
					}
				}
		
			}
	
		}
	
		var accuracy = correct / total_trials
		var missed_responses = (total_trials - sum_responses) / total_trials
		var ave_rt = sum_rt / sum_responses

		feedback_text = "<br><p class = block-text>Please take this time to read your feedback and to take a short break."
		feedback_text += "</p><p class = block-text>You have completed: "+testCount+" out of "+numTestBlocks+" blocks of trials."
		if (testCount == numTestBlocks){
			feedback_text +=
					'</p><p class = block-text>Done with this test.'
			return false; } else {
		if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + getPromptTextList()
		}
		if (missed_responses > missed_response_thresh){
			feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond to each shape as quickly and as accurately as possible.'
		}

      	if (ave_rt > rt_thresh){
        	feedback_text += 
            	'</p><p class = block-text>You have been responding too slowly. Please respond to each shape as quickly and as accurately as possible.'
      	}
		  
		
				return true
			}
		
	}
}

//Set up experiment
flanker_single_task_network__fmri_experiment = []

flanker_single_task_network__fmri_experiment.push(design_setup_block)
flanker_single_task_network__fmri_experiment.push(motor_setup_block)
test_keys(flanker_single_task_network__fmri_experiment, [89, 71])


flanker_single_task_network__fmri_experiment.push(refreshNode)
flanker_single_task_network__fmri_experiment.push(refresh_feedback_block)

cni_bore_setup(flanker_single_task_network__fmri_experiment)

flanker_single_task_network__fmri_experiment.push(testNode0)
flanker_single_task_network__fmri_experiment.push(testNode)
flanker_single_task_network__fmri_experiment.push(feedback_block)

flanker_single_task_network__fmri_experiment.push(end_block)