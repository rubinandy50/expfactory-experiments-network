/* ************************************ */
/* Define helper functions */
/* ************************************ */
function addID() {
  jsPsych.data.addDataToLastTrial({exp_id: 'directed_forgetting_with_flanker__practice'})
}

function getMotorPerm() {
	return motor_perm
}

var getPracticeTrialID = function() {
	return practice_trial_id
}
var practice_trial_id = "instructions"


function assessPerformance() {
	/* Function to calculate the "credit_var", which is a boolean used to
	credit individual experiments in expfactory. */
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
	for (var k = 0; k < possible_responses.length; k++) {
		choice_counts[possible_responses[k]] = 0
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

var randomDraw = function(lst) {
  var index = Math.floor(Math.random() * (lst.length))
  return lst[index]
}


var createTrialTypes = function(numTrialsPerBlock, des_events){
	var stims = []

	if (numTrialsPerBlock == practice_len){ 

		for(var numIterations = 0; numIterations < numTrialsPerBlock/(directed_cond_array.length*flanker_conditions.length); numIterations++){
			for (var numDirectedConds = 0; numDirectedConds < directed_cond_array.length; numDirectedConds++){
				for (var numFlankerConds = 0; numFlankerConds < flanker_conditions.length; numFlankerConds++){
				
					var flanker_condition = flanker_conditions[numFlankerConds]
					var directed_condition = directed_cond_array[numDirectedConds]
					
					var stim = {
						flanker_condition: flanker_condition,
						directed_condition: directed_condition
					}
					
					stims.push(stim)
				}
			}
		}
	stims = jsPsych.randomization.repeat(stims,1) 
	} 
	else {
	for (var num=0; num < numTrialsPerBlock ; num++) {
		event_types = des_events.shift().split('_')
		var stim = {
			flanker_condition: event_types[1],
			directed_condition: event_types[0]
		}
		stims.push(stim)
	} }

	var new_len = stims.length
	var new_stims = []
	
	var used_letters = []
		
	for (var i = 0; i < new_len; i++){
		var temp_stim = stims.shift()
		var temp_flanker_condition = temp_stim.flanker_condition
		var temp_directed_condition = temp_stim.directed_condition		
				
		var letters = getTrainingSet(used_letters,numLetters)
		var cue = getCue()
		var probe = getProbe(temp_directed_condition, letters, cue)
		var correct_response = getCorrectResponse(cue, probe, letters)
		if (cue == 'TOP'){
			memory_set = [letters[2],letters[3]]
			forget_set = [letters[0],letters[1]]
		} else if (cue == 'BOT'){
			memory_set = [letters[0],letters[1]]
			forget_set = [letters[2],letters[3]]
		}
		 
		 if (temp_flanker_condition == 'congruent'){
			flanking_letter = probe
		 } else if (temp_flanker_condition == 'incongruent'){
			flanking_letter = randomDraw(stimArray.filter(function(y) {return $.inArray(y, [probe]) == -1}))
		 }
		
		
		var new_stim = {
			flanker_condition: temp_flanker_condition,
			directed_condition: temp_directed_condition,
			letters: letters,
			cue: cue,
			probe: probe,
			flanking_letter: flanking_letter,
			correct_response: correct_response
			}
	
		new_stims.push(new_stim)
		

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

var getCorrectResponse = function(cue,probe,letters) {
	if (cue == 'TOP') {
		if (jQuery.inArray(probe, letters.slice(numLetters/2)) != -1) {
			return getPossibleResponses()[0][1]
		} else {
			return getPossibleResponses()[1][1]
		}
	} else if (cue == 'BOT') {
		if (jQuery.inArray(probe, letters.slice(0,numLetters/2)) != -1) {
			return getPossibleResponses()[0][1]
		} else {
			return getPossibleResponses()[1][1]
		}
	}		
}

var getResponse = function() {
	return correct_response
}



var appendData = function(){
	curr_trial = jsPsych.progress().current_trial_global
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	
	if (trial_id == 'practice_trial'){
		current_block = 0 
	}else{
		current_block = testCount
	}
	
	current_trial+=1
	
	var lastSet_top = letters.slice(0,numLetters/2)
	var lastSet_bottom = letters.slice(numLetters/2)
	
	jsPsych.data.addDataToLastTrial({
		flanker_condition: flanker_condition,
		directed_forgetting_condition: directed_condition,
		probe: probe,
		cue: cue,
		flanking_letter: flanking_letter,
		correct_response: correct_response,
		current_trial: current_trial,
		current_block: current_block,
		top_stim: lastSet_top,
		bottom_stim: lastSet_bottom
		
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


var getNextStim = function(){
	stim = stims.shift()
	flanker_condition = stim.flanker_condition
	directed_condition = stim.directed_condition
	probe = stim.probe
	letters = stim.letters
	cue = stim.cue
	flanking_letter = stim.flanking_letter
	correct_response = stim.correct_response
	
	return stim
}

var getTrainingStim = function(){
	return task_boards[0] + preFileType + letters[0] + fileTypePNG +
		   task_boards[1]+
		   task_boards[2] + preFileType + letters[1] + fileTypePNG +
		   task_boards[3] + preFileType + letters[2] + fileTypePNG +
		   task_boards[4]+
		   task_boards[5] + preFileType + letters[3] + fileTypePNG +
		   task_boards[6]
}

var getDirectedCueStim = function(){
	return '<div class = bigbox><div class = centerbox><div class = cue-text>'+ preFileType + cue + fileTypePNG +'</font></div></div></div>'	
}

var getProbeStim = function(){
		   
	return flanker_boards[0]+ preFileType + flanking_letter + fileTypePNG +
		   flanker_boards[1]+ preFileType + flanking_letter + fileTypePNG +
		   flanker_boards[2]+ preFileType + probe + fileTypePNG +
		   flanker_boards[3]+ preFileType + flanking_letter + fileTypePNG +
		   flanker_boards[4]+ preFileType + flanking_letter + fileTypePNG
}

var getCategorizeFeedback = function(){
	curr_trial = jsPsych.progress().current_trial_global - 2
	trial_id = jsPsych.data.getDataByTrialIndex(curr_trial).trial_id
	if (trial_id == 'practice_trial'){
		if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == jsPsych.data.getDataByTrialIndex(curr_trial).correct_response){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Correct!</font></div></div>' 
		} else if ((jsPsych.data.getDataByTrialIndex(curr_trial).key_press != jsPsych.data.getDataByTrialIndex(curr_trial).correct_response) && (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != -1)){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Incorrect</font></div></div>' 
	
		} else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == -1){
			
			
			return '<div class = fb_box><div class = center-text><font size = 20>Respond Faster!</font></div></div>'
	
		}
	}
}

function getPromptTaskList() {
	return '<ul style="text-align:left;"><font color="white">'+
							'<li>Please respond if the probe (single letter) was in the memory set.'+
						   	'<li>In memory set: '+getPossibleResponses()[0][0]+'</li>'+
						   	'<li>Not in memory set: '+getPossibleResponses()[1][0]+'</li>'+
						   '</font></ul>'

}


var getPracticeFeedback = function() {
	if (getPracticeTrialID()=='instructions') {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white"><div class = instructbox>'+
		'<p class = instruct-text>In this experiment you will be presented with '+numLetters+' letters on each trial. There will be '+numLetters/2+' at the top and '+numLetters/2+' on the bottom. You must memorize all '+numLetters+' letters.</p> '+
		'<p class = instruct-text>There will be a short delay, then you will see a cue, either <b>TOP</b> or <b>BOT</b>. '+
		'This will instruct you to <b>forget</b> the '+numLetters/2+' letters located at either the top or bottom (respectively) of the screen.</p>'+
		'<p class = instruct-text>The '+numLetters/2+' remaining letters that you must remember are called your <b>memory set</b>. Please forget the letters not in the memory set.</p>'+
		'<p class = instruct-text>So for example, if you get the cue TOP, please forget the top '+numLetters/2+' letters and remember the bottom '+numLetters/2+' letters. The bottom '+numLetters/2+' letters would be your memory set.</p>'+
		'<p class = instruct-text>After a short delay, you will be presented with a probe — a single letter.  Please indicate whether this probe was in your memory set.</p>'+
		'<p class = instruct-text>Press the '+getPossibleResponses()[0][0]+
		' if the probe was in the memory set, and the '+getPossibleResponses()[1][0]+' if not.</p>'+
		'<p class = instruct-text>Please ignore the letters that are not in the middle.</p>'+
			'<p class = instruct-text>Press space to continue</p>' + 
		'</div></font></p></div></div>'

	} else {
		return '<div class = bigbox><div class = picture_box><p class = instruct-text><font color="white">' + feedback_text + '</font></p></div></div>'
	}
	
}

function getChoices() {
	if (getMotorPerm()==0) {
		return [choices[1], choices[0]] 
	} else if (getMotorPerm()==1) {
		return choices
	}
}

function getPossibleResponses() {
	if (getMotorPerm()==0) {
		return possible_responses
	} else if (getMotorPerm()==1) {
		return [['middle finger', 37],['index finger', 39]]
	}
}




/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var motor_perm = 0
// new vars
var practice_len = 16  // must be divisible by 8
var exp_len = 144 // must be divisible by 8
var numTrialsPerBlock = 48; // divisible by directed_cond_array * flanker_conditions
var numTestBlocks = exp_len / numTrialsPerBlock
var choices = [37, 39]

var refresh_len = 4
var practice_thresh = 3
var accuracy_thresh = 0.75
var rt_thresh = 1000
var missed_thresh = 0.10
var directed_cond_array = ['pos', 'pos', 'neg', 'con']
var directed_cue_array = ['TOP','BOT']
var flanker_conditions = ['congruent','incongruent']
var numLetters = 4

var possible_responses = [['index finger', 37], ['middle finger', 39]] 
							 
var current_trial = 0	

var stimArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
	'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
	
var fileTypePNG = '.png"></img>'
var preFileType = '<img class = center src="/static/experiments/directed_forgetting_with_flanker__practice/images/'			 


var stims = []

var task_boards = [['<div class = bigbox><div class = lettersBox><div class = topLeft style="font-size:50px;"><div class = cue-text>'],['</div></div><div class = topMiddle style="font-size:50px;"><div class = cue-text>'],['</div></div><div class = topRight style="font-size:50px;"><div class = cue-text>'],['</div></div><div class = bottomLeft style="font-size:50px;"><div class = cue-text>'],['</div></div><div class = bottomMiddle style="font-size:50px;"><div class = cue-text>'],['</div></div><div class = bottomRight style="font-size:50px;"><div class = cue-text>'],['</div></div></div></div>']]
var flanker_boards = [['<div class = bigbox><div class = centerbox><div class = flanker-text>'],['</div></div></div>']]				
var flanker_boards = [['<div class = bigbox><div class = centerbox><div class = flankerLeft_2><div class = cue-text>'],['</div></div><div class = flankerLeft_1><div class = cue-text>'],['</div></div><div class = flankerMiddle><div class = cue-text>'],['</div></div><div class = flankerRight_1><div class = cue-text>'],['</div></div><div class = flankerRight_2><div class = cue-text>'],['</div></div></div></div>']]					   
				  
ITIs_stim = []
ITIs_resp = [] 

//PRE LOAD IMAGES HERE
var pathSource = "/static/experiments/directed_forgetting_with_flanker__practice/images/"
var images = []

for(i = 0; i < stimArray.length; i++){
	images.push(pathSource + stimArray[i] + '.png')
}
design_events = [] 
images.push(pathSource + 'BOT.png')
images.push(pathSource + 'TOP.png')
jsPsych.pluginAPI.preloadImages(images);

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */


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
		stims = createTrialTypes(practice_len)
		
	}
}

var end_block = {
  type: 'poldrack-text',
  data: {
    trial_id: "end",
  },
  text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p></div>',
  cont_key: [32],
  timing_response: 180000,
 
};

var feedback_text = 'Welcome to the experiment. This experiment will take around 30 minutes. Press <i>enter</i> to begin.'

var practice_feedback_block = {
	type: 'poldrack-single-stim',
	stimulus: getPracticeFeedback,
	data: {
		trial_id: getPracticeTrialID
	},
	choices: [32],

	timing_post_trial: 0,
	is_html: true,
	timing_response: -1, //10 seconds for feedback
	timing_stim: -1,
	response_ends_trial: true,
	on_finish: function() {
		practice_trial_id = "practice-no-stop-feedback"
	} 

};
var feedback_block = {
	type: 'poldrack-single-stim',
	data: {
		trial_id: "feedback_block"
	},
	choices: [32],
	stimulus: getPracticeFeedback,
	timing_post_trial: 0,
	is_html: true,
	timing_response: 100000,
	response_ends_trial: true, 

};
	

var practiceTrials = []
practiceTrials.push(feedback_block)
for (i = 0; i < practice_len; i++) {
	var start_fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation><span style="color:white;">+</span></div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "practice_start_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 500, //500
		timing_response: 500,
		prompt: getPromptTaskList,
		on_finish: function(){
			stim = getNextStim()
		}
	}

	var fixation_block = {
		type: 'poldrack-single-stim',
		stimulus: '<div class = centerbox><div class = fixation><span style="color:white;">+</span></div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "practice_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 2000, //2000
		timing_response: 2000,
		prompt: getPromptTaskList
	}

	var ITI_fixation_block = {
		type: 'poldrack-single-stim',
		is_html: true,
		choices: [getPossibleResponses()[0][1],getPossibleResponses()[1][1]],
		data: {
			trial_id: "practice_ITI_fixation"
		},
		timing_post_trial: 0,
		timing_stim: 1000, //1000
		timing_response: 1000,
		prompt: getPromptTaskList
	}

	var cue_directed_block = {
		type: 'poldrack-single-stim',
		stimulus: getDirectedCueStim,
		is_html: true,
		data: {
			trial_id: "practice_cue",
		},
		choices: false,
		timing_post_trial: 0,
		timing_stim: 1000, //1000
		timing_response: 1000,
		prompt: getPromptTaskList
	};


	var training_block = {
		type: 'poldrack-single-stim',
		stimulus: getTrainingStim,
		is_html: true,
		data: {
			trial_id: "practice_four_letters"
		},
		choices: 'none',
		timing_post_trial: 0,
		timing_stim: 2000, //2000
		timing_response: 2000,
		prompt: getPromptTaskList
	};
	
	var practice_probe_block = {
		type: 'poldrack-single-stim',
		stimulus: getProbeStim,
		choices: [getPossibleResponses()[0][1],getPossibleResponses()[1][1]],
		data: {trial_id: "practice_trial"},
		timing_stim: 1000, //2000
		timing_response: 1000,
		timing_post_trial: 0,
		is_html: true,
		on_finish: appendData,
		prompt: getPromptTaskList,
		show_stim_with_feedback: false,
	};
	  
	var categorize_block = {
		type: 'poldrack-single-stim',
		data: {
			trial_id: "practice-stop-feedback"
		},
		choices: 'none',
		stimulus: getCategorizeFeedback,
		timing_post_trial: 0,
		prompt: getPromptTaskList, 
		is_html: true,
		timing_stim: 500, //500
		timing_response: 500,
		response_ends_trial: false, 

	  };
	practiceTrials.push(start_fixation_block)
	practiceTrials.push(training_block)
	practiceTrials.push(cue_directed_block)
	practiceTrials.push(fixation_block)
	practiceTrials.push(practice_probe_block)
	practiceTrials.push(ITI_fixation_block)
	practiceTrials.push(categorize_block)
}

var practiceCount = 0
var practiceNode = {
	timeline: practiceTrials,
	loop_function: function(data){
		practiceCount += 1
		current_trial = 0
		stims = createTrialTypes(practice_len)
	
		var sum_rt = 0
		var sum_responses = 0
		var correct = 0
		var total_trials = 0
	
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
	
		feedback_text = "<br>Please take this time to read your feedback and to take a short break! Press enter to continue"

		if (accuracy > accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>Done with this practice. Press Enter to continue.' 
			return false
	
		} else if (accuracy < accuracy_thresh){
			feedback_text +=
					'</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + getPromptTaskList() 
					
			if (missed_responses > missed_thresh){
				feedback_text +=
						'</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			}

	      	if (ave_rt > rt_thresh){
	        	feedback_text += 
	            	'</p><p class = block-text>You have been responding too slowly.'
	      	}
		
			if (practiceCount == practice_thresh){
				feedback_text +=
					'</p><p class = block-text>Done with this practice.' 
					return false
			}
			
			feedback_text +=
				'</p><p class = block-text>Redoing this practice. Press Enter to continue.' 
			stims = createTrialTypes(practice_len)

			return true
		
		}
	
	}
	
}



/* create experiment definition array */
var directed_forgetting_with_flanker__practice_experiment = [];
directed_forgetting_with_flanker__practice_experiment.push(motor_setup_block)


directed_forgetting_with_flanker__practice_experiment.push(practiceNode);
directed_forgetting_with_flanker__practice_experiment.push(feedback_block)


directed_forgetting_with_flanker__practice_experiment.push(end_block);