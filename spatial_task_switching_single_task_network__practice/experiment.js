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

function insertBufferITIs(design_ITIs) {
	var buffer_ITIs = genITIs()
	var out_ITIs = []
	while(design_ITIs.length > 0) {
		out_ITIs = out_ITIs.concat(buffer_ITIs.slice(0,2)) //get 2 buffer ITIs to start each block
		buffer_ITIs = buffer_ITIs.slice(2,) //remove the just used buffer ITIs from the buffer ITI array
		
		curr_block_ITIs = design_ITIs.slice(0,numTrialsPerBlock) //get this current block's ITIs
		design_ITIs = design_ITIs.slice(numTrialsPerBlock,) //remove this current block's ITIs from des_ITIs

		out_ITIs = out_ITIs.concat(curr_block_ITIs) //add this current block's ITI's to the out array
	}
	return out_ITIs
}

//Functions added for in-person sessions
function genITIs() { 
	mean_iti = 0.5 //mean and standard deviation of 0.5 secs
	min_thresh = 0
	max_thresh = 4

	lambda = 1/mean_iti
	iti_array = []
	for (i=0; i < exp_len +numTestBlocks ; i++) { //add 3 ITIs per test block to make sure there are enough
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




function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'spatial_task_switching_single_task_network__practice'})
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
	choice_counts[77] = 0
	choice_counts[90] = 0
	
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

//added for motor counterbalancing
function getMotorPerm() {
	return motor_perm
}
function getCurrTask() {
	return curr_task
  }

function getChoices() {
  return [getPossibleResponses()[0][0][1],getPossibleResponses()[0][1][1]]
}
    




function getInstructFeedback() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

function getPracticeFeedback() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + practice_feedback_text + '</p></div></div>'
}

function getPracticeFeedback() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + practice_feedback_text + '</p></div></div>'
}

function getFeedback() {
	return '<div class = bigbox><div class = picture_box><p class = block-text>' + feedback_text + '</p></div></div>'
}


function getPracticeTrialID() {
	return practice_trial_id
}

//feedback functions added for in-person version
function getPracticeFeedback() {
	if (getPracticeTrialID()=='instructions') {
		return 	'<div class = centerbox>'+
		'<p class = block-text>In this experiment, across trials you will see a single number within one of the four quadrants on the screen.'+
		'  Based upon which quadrant the number is presented, you will complete a different task for that number.</p> '+
	
		'<p class = block-text>You will be asked to judge the number on magnitude (higher or lower than 5) or parity (odd or even), depending on which quadrant '+
		'the number is in.</p>'+
	
		'<p class = block-text>In the top two quadrants, please judge the number based on <i>'+predictable_dimensions_list[0].dim+'</i>. Press the <i>'+getPossibleResponses()[0][0][0]+
		'  if '+predictable_dimensions_list[0].values[0]+'</i>, and the <i>'+getPossibleResponses()[0][1][0]+'  if '+predictable_dimensions_list[0].values[1]+'</i>.</p>'+
	
		'<p class = block-text>In the bottom two quadrants, please judge the number based on <i>'+predictable_dimensions_list[1].dim+'.</i>'+
		' Press the <i>'+getPossibleResponses()[1][0][0]+' if '+predictable_dimensions_list[1].values[0]+'</i>, and the <i>'+getPossibleResponses()[1][1][0]+
		' if '+predictable_dimensions_list[1].values[1]+'</i>.</p>' +
		
		'<p class = block-text>We will start practice when you finish instructions. Please make sure you understand the instructions before moving on. During practice, you will receive a reminder of the rules.  <i>This reminder will be taken out for test</i>.</p>'+
		'<p class = block-text>To avoid technical issues, please keep the experiment tab (on Chrome or Firefox) <i>active and in full-screen mode</i> for the whole duration of each task.</p>'+
		'<p class = block-text>When you are ready to continue, please press the spacebar.</p>' +
		'</div>'
	} else {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white">' + practice_feedback_text + '</font></p></div></div>'
	}
}

function getTimeoutMessage() {
	return '<div class = fb_box><div class = center-text>Respond Faster!</div></div>' +
	getPromptText()
}


function randomDraw(lst) {
  var index = Math.floor(Math.random() * (lst.length))
  return lst[index]
}

function getCorrectResponse(number, predictable_dimension){
	if (number > 5){
		magnitude = 'high'
	} else if (number < 5){
		magnitude = 'low'
	}

	if (number%2 === 0){
		parity = 'even'
	} else if (number%2 !== 0) {
		parity = 'odd'
	}
	
	par_ind = predictable_dimensions_list[0].values.indexOf(parity)
	if (par_ind == -1){
		par_ind = predictable_dimensions_list[1].values.indexOf(parity)
		mag_ind = predictable_dimensions_list[0].values.indexOf(magnitude)
	} else {
		mag_ind = predictable_dimensions_list[1].values.indexOf(magnitude)
	}
	
	
	if (predictable_dimension == 'magnitude'){
		correct_response = getPossibleResponses()[0][mag_ind][1]
	} else if (predictable_dimension == 'parity'){
		correct_response = getPossibleResponses()[1][par_ind][1]
	}
	
	
	return [correct_response,magnitude,parity]

}

//added for spatial task
function makeTaskSwitches(numTrials) {
	task_switch_arr = ["tstay_cstay", "tstay_cswitch", "tswitch_cswitch", "tswitch_cswitch"]

	out = jsPsych.randomization.repeat(task_switch_arr, numTrials / 4)
	return out
}

//added for spatial task
function getQuad(oldQuad, curr_switch) {
	var out;
	switch(curr_switch){
		case "tstay_cstay":
			out = oldQuad
			break
		case "tstay_cswitch":
			if (oldQuad%2==0) { // if even (2,4), subtract 1
				out = oldQuad - 1
			} else {
				out = oldQuad + 1 //if odd (1,3), add 1
			}
			break
		case "tswitch_cswitch":
			if (oldQuad < 3) { //if in top quadrants (1,2)
				out = Math.ceil(Math.random() * 2) + 2 // should return 3 or 4
			} else  { //if in bottom quadrants (3,4) 
				out = Math.ceil(Math.random() * 2)  // should return 1 or 2
			}
			break
	}
	return out;
}
function createTrialTypes(task_switches){
	//make the first trial
	var whichQuadStart = jsPsych.randomization.repeat([1,2,3,4],1).pop()
	var predictable_cond_array = predictable_conditions[whichQuadStart%2]
	var predictable_dimensions = [predictable_dimensions_list[0].dim,
								 predictable_dimensions_list[0].dim,
								 predictable_dimensions_list[1].dim,
								 predictable_dimensions_list[1].dim]
		
	numbers_list = [[6,8],[7,9],[2,4],[1,3]]
	numbers = [1,2,3,4,6,7,8,9]	
	
	predictable_dimension = predictable_dimensions[whichQuadStart - 1]
	
	number = numbers[Math.floor((Math.random() * 8))]
	
	
	response_arr = getCorrectResponse(number,predictable_dimension)
	
	var stims = []
	
	var first_stim = {
		whichQuadrant: whichQuadStart,
		predictable_condition: 'N/A',
		predictable_dimension: predictable_dimension,
		number: number,
		magnitude: response_arr[1],
		parity: response_arr[2],
		correct_response: response_arr[0]
		}
	stims.push(first_stim)
	
	//build remaining trials from task_switches
	oldQuad = whichQuadStart
	for (var i = 0; i < task_switches.length; i++){
		whichQuadStart += 1
		quadIndex = whichQuadStart%4
		if (quadIndex === 0){
			quadIndex = 4
		}
		quadIndex = getQuad(oldQuad, task_switches[i]) //changed for spatial task

		predictable_dimension = predictable_dimensions[quadIndex - 1]
		number = numbers[Math.floor((Math.random() * 8))]
	
		response_arr = getCorrectResponse(number,predictable_dimension)
		
		stim = {
			whichQuadrant: quadIndex,
			predictable_condition: predictable_cond_array[quadIndex - 1],
			predictable_dimension: predictable_dimension,
			number: number,
			magnitude: response_arr[1],
			parity: response_arr[2],
			correct_response: response_arr[0]
			}
		
		stims.push(stim)

		oldQuad = quadIndex //changed for sptial task
		
	}

	return stims	
}



function getFixation(){
    return '<div class = centerbox><div class = fixation>+</div></div>'

}

function getCue(){
	stim = stims.shift()
	predictable_condition = stim.predictable_condition
	predictable_dimension = stim.predictable_dimension
	number = stim.number
	correct_response = stim.correct_response
	whichQuadrant = stim.whichQuadrant
	magnitude = stim.magnitude
	parity = stim.parity
	
	return stop_boards[whichQuadrant - 1][0] + '<div class = fixation>+</div>' + stop_boards[whichQuadrant - 1][1] 
}

function getStim(){
	
	return task_boards[whichQuadrant - 1][0] + 
				preFileType + number + fileTypePNG +
		   task_boards[whichQuadrant - 1][1]
}

function getResponse() {
	return correct_response
}

function appendData(){
	curr_trial = jsPsych.progress().current_trial_global
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	current_trial+=1
	task_switch = 'na'
	if (current_trial > 1) {
		task_switch = task_switches[current_trial - 2] //this might be off
	}
	
	
	if (trial_id == 'practice_trial'){
		current_block = practiceCount
	} else if (trial_id == 'refresh_trial'){
		current_block = refreshCount
	} else if (trial_id == 'test_trial') {
		current_block = testCount
	}
	
	jsPsych.data.addDataToLastTrial({
		predictable_condition: predictable_condition,
		predictable_dimension: predictable_dimension,
		task_switch: task_switch,
		number: number,
		correct_response: correct_response,
		whichQuadrant: whichQuadrant,
		magnitude: magnitude,
		parity: parity,
		current_trial: current_trial,
		current_block: current_block,
		
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

 // poassible_responses[a][b][c]:
 // a)  magnitude (0) vs parity (1)
 // b) high/even (0) vs low/odd (1)
 // c) keystr (0) vs keycode (1)

function getPossibleResponses(){
	mperm = getMotorPerm()
	if (mperm%2==0) {
		stim1 = [['middle finger', 39],['index finger', 37]]
	} else {
		stim1 = [['index finger', 37], ['middle finger', 39]]
	}
	if (mperm<2){
		stim2 = [['middle finger', 39],['index finger', 37]]
	} else {
		stim2 = [['index finger', 37], ['middle finger', 39]]
	}
	return [stim1, stim2]

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
var practice_len =  16  //divisible by 4,  2 (switch or stay) by 2 (mag or parity)]
var refresh_len =  8  //divisible by 4,  2 (switch or stay) by 2 (mag or parity)]
var exp_len = 208 // must be divisible by 4
var numTrialsPerBlock = 52; //  divisible by 4
var numTestBlocks = exp_len / numTrialsPerBlock


var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_thresh = 0.10 
var practice_thresh = 4 // 4 blocks of 16 trials


var predictable_conditions = [['switch','stay'],
							 ['stay','switch']]
							 
var predictable_dimensions_list = [stim = {dim:'magnitude', values: ['high','low']},
								  stim = {dim:'parity', values: ['even','odd']}]
								 
 // poassible_responses[a][b][c]:
 // a)  magnitude (0) vs parity (1)
 // b) high/even (0) vs low/odd (1)
 // c) keystr (0) vs keycode (1)
var possible_responses = [[['middle finger', 39],['index finger', 37]],
						  [['middle finger', 39],['index finger', 37]]]


var fileTypePNG = ".png'></img>"
var preFileType = "<img class = center src='/static/experiments/spatial_task_switching_single_task_network__practice/images/"

var current_trial = 0

var task_boards = [[['<div class = bigbox><div class = quad_box><div class = decision-top-left><div class = gng_number><div class = cue-text>'],['</div></div></div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-top-right><div class = gng_number><div class = cue-text>'],['</div></div></div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-bottom-right><div class = gng_number><div class = cue-text>'],['</div></div></div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-bottom-left><div class = gng_number><div class = cue-text>'],['</div></div></div></div></div>']]]

var stop_boards = [[['<div class = bigbox><div class = quad_box><div class = decision-top-left>'],['</div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-top-right>'],['</div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-bottom-right>'],['</div></div></div>']],
				   [['<div class = bigbox><div class = quad_box><div class = decision-bottom-left>'],['</div></div></div>']]]

var task_switches = makeTaskSwitches(practice_len)
var stims = createTrialTypes(task_switches)




function getPromptTextList() {
	return '<ul style="text-align:left;">'+
	'<li>Top 2 quadrants: Judge number on '+predictable_dimensions_list[0].dim+'</li>' +
	'<li>'+predictable_dimensions_list[0].values[0]+': ' + getPossibleResponses()[0][0][0] + '</li>' +
	'<li>'+predictable_dimensions_list[0].values[1]+': ' + getPossibleResponses()[0][1][0] + '</li>' +
	'<li>Bottom 2 quadrants: Judge number on '+predictable_dimensions_list[1].dim+'</li>' +
	'<li>'+predictable_dimensions_list[1].values[0]+': ' + getPossibleResponses()[1][0][0] + '</li>' +
	'<li>'+predictable_dimensions_list[1].values[1]+': ' + getPossibleResponses()[1][1][0] + '</li>' +
  '</ul>'
}


function getPromptText() {
	return '<div class = fixation>'+
	'<p class = center-block-text style = "font-size:16px;">Top 2 quadrants: Judge number on '+predictable_dimensions_list[0].dim+'</p>' +
	'<p class = center-block-text style = "font-size:16px;">'+predictable_dimensions_list[0].values[0]+': ' + getPossibleResponses()[0][0][0] +  ' | ' + predictable_dimensions_list[0].values[1]+': ' + getPossibleResponses()[0][1][0] + '</p>' +
	'<p>+</p>' +
	'<p class = center-block-text style = "font-size:16px;">Bottom 2 quadrants: Judge number on '+predictable_dimensions_list[1].dim+'</p>' +
	'<p class = center-block-text style = "font-size:16px;">'+predictable_dimensions_list[1].values[0]+': ' + getPossibleResponses()[1][0][0] +  ' | ' + predictable_dimensions_list[1].values[1]+': ' + getPossibleResponses()[1][1][0] + '</p>' +
'</div>'
}

				  
//PRE LOAD IMAGES HERE
var pathSource = "/static/experiments/spatial_task_switching_single_task_network__practice/images/"
var pathDesignSource = "/static/experiments/spatial_task_switching_single_task_network__practice/designs/" //ADDED FOR fMRI SEQUENCES

var numbersPreload = ['1','2','3','4','5','6','7','8','9','10']
var images = []
for(i=0;i<numbersPreload.length;i++){
	images.push(pathSource + numbersPreload[i] + '.png')
}
jsPsych.pluginAPI.preloadImages(images);


//ADDED FOR SCANNING
//fmri variables
var ITIs_stim = []
var ITIs_resp = []

var practice_trial_id = "instructions"
var practice_feedback_timing = -1
var practice_response_ends = true

var motor_perm = 0
/* ************************************ */
/* Set up jsPsych blocks */
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
		des_ITIs = insertBufferITIs(des_ITIs)
		ITIs_stim = des_ITIs.slice(0)
		ITIs_resp = des_ITIs.slice(0)
		des_task_switches = await getdesignEvents(design_perm)
	}
}

var motor_setup_block = {
	type: 'survey-text',
	data: {
		trial_id: "motor_setup"
	},
	questions: [
		[
			"<p class = center-block-text>motor permutation (0-3):</p>"
		]
	], on_finish: function(data) {
		motor_perm=parseInt(data.responses.slice(7, 10))
		task_switches = makeTaskSwitches(practice_len)
		stims = createTrialTypes(task_switches)
		
	}
}


var feedback_text = 
'Welcome to the experiment. This experiment will take around 5 minutes. Press <i>enter</i> to begin.'

var practice_feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: getPracticeTrialID
	},
	choices: [32],
	stimulus: getPracticeFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: -1, //10 seconds for feedback
	timing_stim: -1,
	response_ends_trial: true,
	on_finish: function() {
		practice_trial_id = "practice-no-stop-feedback"
		practice_feedback_timing = 10000
		practice_response_ends = false
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
	timing_response: 180000,
	response_ends_trial: true, 

};


var practice_end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>Thanks for completing this Practice!</p></div>',
	cont_key: [32],
	timing_post_trial: 0,
	on_finish: function(){
  	assessPerformance()
  }
};


var practiceTrials = []
practiceTrials.push(practice_feedback_block)

for (i = 0; i < practice_len + 1; i++) {
	var fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: getFixation,
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "practice_fixation"
		},
		timing_response: 500, //500
		timing_post_trial: 0,
		prompt: getPromptText
	}

	var practice_cue_block = {
		type: 'poldrack-single-stim',
		stimulus: getCue,
		is_html: true,
		choices: 'none',
		data: {
		trial_id: 'practice_cue'
		},
		timing_response: 150, //getCTI
		timing_stim: 150,  //getCTI
		timing_post_trial: 0,
		prompt: getPromptText
	  };
	
	
	var practice_block = {
		type: 'poldrack-categorize',
		stimulus: getStim,
		data: {
			"trial_id": "practice_trial"
		},
		key_answer: getResponse,
		correct_text: '<div class = fb_box><div class = center-text><font size =20>Correct</font></div></div>' ,
		incorrect_text: '<div class = fb_box><div class = center-text><font size =20>Incorrect</font></div></div>' ,
		timeout_message: getTimeoutMessage,
		show_stim_with_feedback: false,
		is_html: true,
		choices: getChoices,
		timing_stim: 1000, //1000
		timing_response: 2000, //2000
		timing_feedback_duration: 500, //500
		response_ends_trial: false,
		timing_post_trial: 0,
		on_finish: appendData,
		prompt: getPromptText
	}
	
	practiceTrials.push(fixation_block)
	practiceTrials.push(practice_cue_block)
	practiceTrials.push(practice_block)
}


var practiceCount = 0
var practiceNode = {
	timeline: practiceTrials,
	loop_function: function(data){
		practiceCount += 1
		task_switches = makeTaskSwitches(practice_len)
		stims = createTrialTypes(task_switches)
		current_trial = 0
	
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
		var total_stop_trials = 0
		var stop_succeed = 0
		var stop_fail = 0
	
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
	
		practice_feedback_text = "<br><p class = block-text>Please take this time to read your feedback and to take a short break!</p>"

		if (accuracy > accuracy_thresh){
			practice_feedback_text +=
					'</p><p class = block-text>Done with this practice. When you are ready to continue, press the spacebar.' 
			task_switches = makeTaskSwitches(numTrialsPerBlock)
			stims = createTrialTypes(task_switches)
			return false
	
		} else if (accuracy < accuracy_thresh){
			practice_feedback_text +=
					'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + getPromptTextList()
			
			
			if (missed_responses > missed_thresh){
				practice_feedback_text +=
					'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	practice_feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
	      	}
		
			if (practiceCount == practice_thresh){
				practice_feedback_text +=
					'</p><p class = block-text>Done with this practice.' 
				task_switches = makeTaskSwitches(numTrialsPerBlock)
				stims = createTrialTypes(task_switches)
				return false
			}
			
			practice_feedback_text +=
				'</p><p class = block-text>Redoing this practice. When you are ready to continue, press the spacebar.' 
			
			return true
		
		}
	
	}
	
}


/* create experiment definition array */
spatial_task_switching_single_task_network__practice_experiment = []

spatial_task_switching_single_task_network__practice_experiment.push(motor_setup_block); //exp_input

spatial_task_switching_single_task_network__practice_experiment.push(practiceNode)
spatial_task_switching_single_task_network__practice_experiment.push(practice_feedback_block)
spatial_task_switching_single_task_network__practice_experiment.push(practice_end_block)
