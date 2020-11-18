/* ************************************ */
/* Define helper functions */
/* ************************************ */
function addID() {
	jsPsych.data.addDataToLastTrial({exp_id: 'go_nogo_single_task_network__fmri'})
  }
  
  var key_choices = [['index finger', 89], ['middle finger', 71]] //fmri responses - keys: BYGRM = thumb->pinky
  
  function getRefreshTrialID() {
	  return refresh_trial_id
  }
  
  function updateTrialTypesWithDesigns(numTrialsPerBlock) { 
  	var new_stims = [] 
	  
	  goTrial = {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'test_trial'
		}
	}		
	nogoTrial = { 
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[1][1] + '></div></div></div></div></div>',
		data: {
			correct_response: getCorrectMapping()[1][1],
			go_nogo_condition: getCorrectMapping()[1][0],
		  trial_id: 'test_trial'	
	}
} 

	  curr_des_events = des_events.slice(0, numTrialsPerBlock) //grab this block's event
	  des_events = des_events.slice(numTrialsPerBlock,) // drop them from the array
  	for (var idx = 0; idx < curr_des_events.length; idx++) {
  		nogo_condition = curr_des_events[idx]
  		if (nogo_condition == 'NoGo') {
  			stim = nogoTrial;
  		}
  		if (nogo_condition == 'Go')  { 
  			stim = goTrial;
  		 } 
  		new_stims.unshift(stim)
		  
  	}
  	return new_stims
  }
  
  
  function getRefreshFeedbackTiming() {
	  return refresh_feedback_timing
  }
  
  function getRefreshResponseEnds() {
	  return refresh_response_ends
  }
  //Functions added for in-person sessions
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
  

  
  //added for motor counterbalancing
  function getMotorPerm() {
	  return motor_perm
  }
  
  function getKey() {
	  return [getPossibleResponses()[1]]
  }
  
  function getPossibleResponses() {
	  if (getMotorPerm()==0) {
		  return ['index finger', 89]
	  } else if (getMotorPerm()==1) {
		  return ['middle finger', 71]
	  }
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
  
  function evalAttentionChecks() {
	var check_percent = 1
	if (run_attention_checks) {
	  var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
	  var checks_passed = 0
	  for (var i = 0; i < attention_check_trials.length; i++) {
		if (attention_check_trials[i].correct === true) {
		  checks_passed += 1
		}
	  }
	  check_percent = checks_passed / attention_check_trials.length
	}
	return check_percent
  }
  
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
	  choice_counts[32] = 0
	  
	  for (var i = 0; i < experiment_data.length; i++) {
		  if (experiment_data[i].trial_id == 'test_trial') {
			  trial_count += 1
			  key = experiment_data[i].key_press
			  choice_counts[key] += 1
			  if (experiment_data[i].go_nogo_condition == 'go'){
				  if (experiment_data[i].key_press == experiment_data[i].correct_response){
					  correct += 1
				  }
				  if (experiment_data[i].key_press == -1){
					  missed_count += 1
				  }
				  if (experiment_data[i].key_press != -1){
					  rt = experiment_data[i].rt
					  rt_array.push(rt)
				  }
			  } else if (experiment_data[i].go_nogo_condition == 'nogo'){
				  if (experiment_data[i].key_press == -1){
					  correct += 1
				  } else if (experiment_data[i].key_press != -1){
					  rt = experiment_data[i].rt
					  rt_array.push(rt)
				  }
			  }
		  }	
	  }
	  
	  //calculate average rt
	  var avg_rt = -1
	  if (rt_array.length !== 0) {
		  avg_rt = math.median(rt_array) // ???median???
	  } 
	  //calculate whether response distribution is okay
	  var responses_ok = true
	  Object.keys(choice_counts).forEach(function(key, index) {
		  if (choice_counts[key] > trial_count * 0.95) {
			  responses_ok = false
		  }
	  })
	  var missed_percent = missed_count/trial_count
	  var accuracy = correct / trial_count
	  credit_var = (missed_percent < 0.25 && avg_rt > 200 && accuracy > 0.60)
	  jsPsych.data.addDataToLastTrial({final_credit_var: credit_var,
									   final_missed_percent: missed_percent,
									   final_avg_rt: avg_rt,
									   final_responses_ok: responses_ok,
									   final_accuracy: accuracy})
  }
  
  
  var get_response_time = function() {
	gap = 750 + Math.floor(Math.random() * 500) + 250
	return gap;
  }
  
  /* Append gap and current trial to data and then recalculate for next trial*/
  var appendData = function(data) {
	  var curr_trial = jsPsych.progress().current_trial_global
	
	  if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press == correct_response){
		  jsPsych.data.addDataToLastTrial({
			  correct_trial: 1,
		  })
  
	  } else if (jsPsych.data.getDataByTrialIndex(curr_trial).key_press != correct_response){
		  jsPsych.data.addDataToLastTrial({
			  correct_trial: 0,
		  })
	  }
	  
	  jsPsych.data.addDataToLastTrial({
		  current_trial: current_trial,
	  })
	  
	  current_trial +=1
  }
  
  var getFeedback = function() {
	if (stim.key_answer == -1) {
	  return '<div class = fb_box><div class = center-text>Correct!</div></div>' + prompt_text_list
	} else {
	  return '<div class = fb_box><div class = center-text>Respond Faster!</div></p></div>'  + prompt_text_list
	}
  }
  
  var getBlockFeedback = function() {
	  return '<div class = bigbox><div class = picture_box><p class = block-text><font color="white">' + feedback_text + '</font></p></div></div>'
  }
  
  
  var getInstructFeedback = function() {
	return '<div class = centerbox><p class = block-text>' + feedback_instruct_text +
	  '</p></div>'
  }

function getGlobal() { 
	stim = block_stims.pop()
	correct_response = stim.correct_response
	return '<div class = centerbox><div class = fixation>+</div></div>'

}


var getStim = function(){
	return stim.stimulus
}

var getData = function(){
	return stim.data
}

var getCorrectResponse = function(){
	return stim.data.correct_response
}
  
  
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
  
  function getRefreshFeedback() { 
	  if (exp_id='instructions') {
  return '<div class = bigbox><div class = centerbox><p class = block-text>' + 
		  'In this experiment, ' + stims[0][0] + ' and ' + stims[1][0] + ' squares will appear on the screen. '+
		  'If you see the ' + stims[0][0] + ' square you should <b> respond by pressing your ' + getPossibleResponses()[0] +  ' as quickly as possible</b>. '+
		  'If you see the ' + stims[1][0] + ' square you should <b> not respond</b>.</p>'+
		  '<p class = block-text>We will begin with practice. You will receive feedback telling you if you were correct.</p>'+
		  '<p class = block-text> Press any button when you are ready to begin </p></div></div>'} 
  
		  else {
			  return '<div class = bigbox><div class = centerbox><p class = instruct-text><font color="white">' + refresh_feedback_text + '</font></p></div></div>'
  
		   }
	
  }
  
  /* ************************************ */
  /* Define experimental variables */
  /* ************************************ */
  // generic task variables
  var run_attention_checks = true
  var attention_check_thresh = 0.45
  var sumInstructTime = 0 //ms
  var instructTimeThresh = 0 ///in seconds
  var credit_var = 0
  var block_stims = []
  
  
  // task specific variables
  var num_go_stim = 6 //per one no-go stim
  function getCorrectMapping() { 
   correct_responses = [
	  ['go', [getPossibleResponses()[1]]],
	  ['nogo', -1]
	]
	return correct_responses
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
		  block_stims = createPracticeTrials(practice_length) 
	  }
  }
  practice_stimuli = []
  //var  f = jsPsych.randomization.shuffle([["orange", "stim1"],["blue","stim2"]])
  var motor_perm = 0
  var stims = [["solid", "stim1"],["outlined","stim2"]] //solid and outlined squares used as stimuli for this task are not png files as in some others, but they are defined in style.css
  var stim = []
  var gap = 0
  var refresh_trial_id = "instructions"
  var refresh_feedback_timing = -1
  var refresh_response_ends = true
  var current_trial = 0
  var practice_length = 6
  
  function createPracticeTrials(practice_length) { 
   var practice_stimuli = [{ //To change go:nogo ratio, add or remove one or more sub-dictionaries within practice_stimuli and test_stimuli_block
	stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div id = ' + stims[1][1] + '></div></div></div></div></div>',
	data: {
	  correct_response: getCorrectMapping()[1][1],
	  go_nogo_condition: getCorrectMapping()[1][0],
	  trial_id: 'practice_trial'
	},
	key_answer: getCorrectMapping()[1][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }, {
		stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
		data: {
		  correct_response: getCorrectMapping()[0][1],
		  go_nogo_condition: getCorrectMapping()[0][0],
		  trial_id: 'practice_trial'
		},
		key_answer: getCorrectMapping()[0][1]
  }
  ];
	  stimuli = jsPsych.randomization.repeat(practice_stimuli, practice_length / practice_stimuli.length); 
	  return stimuli 
  }
  
  
  //set up block stim. test_stim_responses indexed by [block][stim][type]
  function getTestStimuli(numTrialsPerBlock) { 
  var test_stimuli_block = [{
	stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div id = ' + stims[1][1] + '></div></div></div></div></div>',
	data: {
	  correct_response: getCorrectMapping()[1][1],
	  go_nogo_condition: getCorrectMapping()[1][0],
	  trial_id: 'test_trial'
	}
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  },{
	  stimulus: '<div class = bigbox><div class = centerbox><div class = gng_number><div class = cue-text><div  id = ' + stims[0][1] + '></div></div></div></div></div>',
	  data: {
		correct_response: getCorrectMapping()[0][1],
		go_nogo_condition: getCorrectMapping()[0][0],
		trial_id: 'test_trial'
	  }
  }];
	   test_stimuli_block = jsPsych.randomization.repeat(test_stimuli_block, numTrialsPerBlock / test_stimuli_block.length);
  
   return test_stimuli_block
  }
  
  var accuracy_thresh = 0.75
  var rt_thresh = 1000
  var missed_thresh = 0.10
  
  var refresh_len = 7
  practice_len = 1
  var practice_thresh = 1
  var refresh_thresh = 1
  
  
  var exp_len = 252 //multiple of numTrialsPerBlock
  var numTrialsPerBlock = 63 // multiple of 7 (6go:1nogo)
  var numTestBlocks = exp_len / numTrialsPerBlock
  
  var pathDesignSource = "/static/experiments/go_nogo_single_task_network__fmri/designs/" //ADDED FOR fMRI SEQUENCES
  
  
  //ADDED FOR SCANNING
  //fmri variables
  var ITIs_stim = []
  var ITIs_resp = []
  
  
  var prompt_text_list = '<ul style="text-align:left;"><font color="white">'+
						  '<li>'+stims[0][0]+' square: respond</li>' +
						  '<li>'+stims[1][0]+' square: do not respond</li>' +
						'</font></ul>'
  
  /* ************************************ */
  /* Set up jsPsych blocks */
  /* ************************************ */
  // Set up attention check node
  
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
	  }
  }
  
  /* define static blocks */
  var feedback_instruct_text =
	'Welcome to the experiment.'
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

  var refresh_feedback_block = {
	  type: 'poldrack-single-stim',
	  data: {
		  trial_id: getRefreshTrialID
	  },
	  stimulus: getRefreshFeedback,
	  timing_post_trial: 0,
	  is_html: true,
	  timing_response: getRefreshFeedbackTiming, //10 seconds for feedback
	  timing_stim: getRefreshFeedbackTiming,
	  response_ends_trial: getRefreshResponseEnds,
	  cont_key: [32],
	  on_finish: function() {
		  refresh_trial_id = "practice-no-stop-feedback"
		  refresh_feedback_timing = 10000
		  refresh_response_ends = false
	  } 
  };
  var end_block = {
	  type: 'poldrack-text',
	  timing_response: 10000,
	  data: {
		trial_id: "end",
	  },
	  text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p>'+'</div>',
	  cont_key: [32],
	  timing_post_trial: 0,
	  on_finish: function(){
			assessPerformance()	  
		  }
	};
  
  var start_test_block = {
	type: 'poldrack-text',
	timing_response: 180000,
	data: {
	  trial_id: "test_intro"
	},
	text: '<div class = centerbox><p class = block-text>Practice is over, we will now begin the experiment. You will no longer receive feedback about your responses.</p>'+
	'<p class = block-text>Remember, if you see the ' + stims[0][0] + ' square you should <b> respond by pressing the spacebar as quickly as possible</i>. '+
	'If you see the ' + stims[1][0] + ' square you should <i> not respond</i>.',
	cont_key: [13],
	timing_post_trial: 1000,
	on_finish: function(){
	feedback_text = 
	  'Starting a test block.'
	
	}
  };
  
  var reset_block = {
	type: 'call-function',
	data: {
	  trial_id: "reset_trial"
	},
	func: function() {
	  current_trial = 0
	},
	timing_post_trial: 0
  }
  
  var feedback_text = 
	  'Welcome to the experiment.'
  
  var feedback_block = {
	  type: 'poldrack-single-stim',
	  data: {
		  trial_id: "feedback_block"
	  },
	  choices: 'none',
	  stimulus: getBlockFeedback,
	  timing_post_trial: 0,
	  is_html: true,
	  timing_response: 10000,
	  response_ends_trial: false, 
  
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
	  timing_stim: getITI_stim,
	  timing_response: getITI_resp
  };
  
  var prompt_fixation_block = {
	  type: 'poldrack-single-stim',
	  stimulus: '<div class = centerbox><div class = fixation>+</div></div>',
	  is_html: true,
	  choices: 'none',
	  data: {
		  trial_id: "prompt_fixation",
	  },
	  timing_post_trial: 0,
	  timing_stim: 500,
	  timing_response: 500,
	  prompt: prompt_text_list
  };
  
  
  var refreshTrials = []
  refreshTrials.push(refresh_feedback_block)
  for (var i = 0; i < refresh_len; i ++){
  
	  var update_global_fixation = {
			  type: 'poldrack-single-stim',
			  stimulus: getGlobal, 
			  is_html: true,
			  choices: 'none',
			  data: {
				  trial_id: "update_correct_response",
			  },
			  timing_post_trial: 0,
			  timing_stim: 500,
			  timing_response: 500,
			  prompt: prompt_text_list,
			  fixation_default: true
		  };
  
  
	  var refresh_block = {
		type: 'poldrack-categorize',
		stimulus: getStim,
		is_html: true,
		data: getData,
		key_answer: getCorrectResponse,
		correct_text: '<div class = fb_box><div class = center-text>Correct!</div></div>',
		incorrect_text: '<div class = fb_box><div class = center-text><font size = 20>Incorrect!</font></div></div>', 
		timeout_message: getFeedback,
		choices: getKey,
		timing_response: 2000, //2000
		timing_stim: 1000, //1000
		timing_feedback_duration: 500,
		show_stim_with_feedback: false,
		fixation_default: true, 
		timing_post_trial: 0,
		on_finish: appendData,
		prompt: prompt_text_list
	  }
	  
	  refreshTrials.push(update_global_fixation)
	  refreshTrials.push(refresh_block)
  }
  
  var refreshCount = 0
  var refreshNode = {
	  timeline: refreshTrials,
	  loop_function: function(data){
		  refreshCount += 1
		  current_trial = 0
		  var sum_rt = 0
		  var sum_responses = 0
		  var correct = 0
		  var total_trials = 0
		  
		  var total_go_trials = 0
		  var missed_response = 0
	  
		  for (var i = 0; i < data.length; i++){
			  if (data[i].trial_id == "practice_trial"){
				  total_trials+=1
				  if (data[i].rt != -1){
					  sum_rt += data[i].rt
					  sum_responses += 1
				  }
				  if (data[i].key_press == data[i].correct_response){
					  correct += 1
	  
				  }
				  
				  if (data[i].go_nogo_condition == 'go'){
					  total_go_trials += 1
					  if (data[i].rt == -1){
						  missed_response += 1
					  }
				  }
				  
			  }
		  }
	  
		  var accuracy = correct / total_trials
		  var missed_responses = missed_response / total_go_trials
		  var ave_rt = sum_rt / sum_responses
	  
		  feedback_text = "<br>Please take this time to read your feedback and to take a short break! "
  
		  if (accuracy > accuracy_thresh){
			  return false
	  
		  } else if (accuracy < accuracy_thresh){
			  feedback_text +=
					  '</p><p class = block-text>We are going to try practice again to see if you can achieve higher accuracy.  Remember: <br>' + prompt_text_list
					  
			  if (missed_responses > missed_thresh){
				  feedback_text +=
						  '</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			  }
		  
		block_stims = updateTrialTypesWithDesigns(numTrialsPerBlock)

		return false
		  
		  }
	  
	  }
	  
  }
  
  
  var testTrials0 = []
  for (var i = 0; i < numTrialsPerBlock; i ++){

	var update_global_fixation = {
		type: 'poldrack-single-stim',
		stimulus: getGlobal, 
		is_html: true,
		choices: [89, 71],
		data: {
			trial_id: "update_correct_response",
		},
		timing_post_trial: 0,
		timing_stim: getITI_stim,
		timing_response: getITI_resp,
		fixation_default: true
	};
	  var test_block = {
		  type: 'poldrack-single-stim',
		  stimulus: getStim,
		  is_html: true,
		  choices: getKey,
		  data: getData,
		  fixation_default: true,
		  timing_post_trial: 0,
		  timing_stim: 1000, //1000
		  timing_response: 2000, //2000
		  on_finish: appendData
	  };
	  testTrials0.push(update_global_fixation)
	  testTrials0.push(test_block)
  }
  
  
  
  var testCount = 0
  var testNode0 = {
	  timeline: testTrials0,
	  loop_function: function(data){
		  testCount += 1
		  current_trial = 0
		  
		  var sum_rt = 0
		  var sum_responses = 0
		  var correct = 0
		  var total_trials = 0
		  var total_go_trials = 0
		  var missed_response = 0
		  
	  
		  for (var i = 0; i < data.length; i++){
			  if (data[i].trial_id == "test_trial"){
				  total_trials+=1
				  if (data[i].rt != -1){
					  sum_rt += data[i].rt
					  sum_responses += 1
				  }
				  if (data[i].key_press == data[i].correct_response){
					  correct += 1
	  
				  }
				  
				  if (data[i].go_nogo_condition == 'go'){
					  total_go_trials += 1
					  if (data[i].rt == -1){
						  missed_response += 1
					  }
				  }
			  }
		  }
		  var accuracy = correct / total_trials
		  var missed_responses = missed_response / total_go_trials
		  var ave_rt = sum_rt / sum_responses
	  
		  feedback_text = "Please take this time to read your feedback and to take a short break!"
		  feedback_text += "</p><p class = block-text>You have completed " +testCount+ " out of " +numTestBlocks+ " blocks of trials."

		  if (accuracy < accuracy_thresh){
		  feedback_text +=
				  '</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + prompt_text_list
				  
		  }
  
		  if (ave_rt > rt_thresh) {
			  feedback_text += 
				  '</p><p class = block-text>You have been responding too slowly.'
		  }
		  
		  if (missed_responses > missed_thresh){
			  feedback_text +=
					  '</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
		  }
	  
	  
		  block_stims = updateTrialTypesWithDesigns(numTrialsPerBlock)
		  
		  trial_id = 'test_trial'
		  return false
		  
	  
	  }
	  
  }
  
  var testTrials = []
  testTrials.push(feedback_block)
  for (var i = 0; i < numTrialsPerBlock; i ++){

	var update_global_fixation = {
		type: 'poldrack-single-stim',
		stimulus: getGlobal, 
		is_html: true,
		choices: 'none',
		data: {
			trial_id: "update_correct_response",
		},
		timing_post_trial: 0,
		timing_stim: getITI_stim,
		timing_response: getITI_resp,
		fixation_default: true
	};
	  
	  var test_block = {
		  type: 'poldrack-single-stim',
		  stimulus: getStim,
		  is_html: true,
		  choices: getKey,
		  data: getData,
		  fixation_default: true,
		  timing_post_trial: 0,
		  timing_stim: 1000, //1000
		  timing_response: 2000, //2000
		  on_finish: appendData
	  };
	  testTrials.push(update_global_fixation)
	  testTrials.push(test_block)
  }
  
  var testNode = {
	  timeline: testTrials,
	  loop_function: function(data){
		  testCount += 1
		  current_trial = 0
	  
		  var sum_rt = 0
		  var sum_responses = 0
		  var correct = 0
		  var total_trials = 0
		  var total_go_trials = 0
		  var missed_response = 0

		  block_stims = updateTrialTypesWithDesigns(numTrialsPerBlock)

		  for (var i = 0; i < data.length; i++){
			  if (data[i].trial_id == "test_trial"){
				  total_trials+=1
				  if (data[i].rt != -1){
					  sum_rt += data[i].rt
					  sum_responses += 1
				  }
				  if (data[i].key_press == data[i].correct_response){
					  correct += 1
	  
				  }
				  
				  if (data[i].go_nogo_condition == 'go'){
					  total_go_trials += 1
					  if (data[i].rt == -1){
						  missed_response += 1
					  }
				  }
			  }
		  }
		  var accuracy = correct / total_trials
		  var missed_responses = missed_response / total_go_trials
		  var ave_rt = sum_rt / sum_responses
	  
		  feedback_text = "<br>Please take this time to read your feedback and to take a short break!"
		  feedback_text += "</p><p class = block-text>You have completed " +testCount+ " out of " +numTestBlocks+ " blocks of trials."
  
		  if (testCount >= numTestBlocks){
			  
			  feedback_text +=
					  '</p><p class = block-text>Done with this test. '
			  return false
	  
		  } else {
			  if (accuracy < accuracy_thresh){
			  feedback_text +=
					  '</p><p class = block-text>Your accuracy is too low.  Remember: <br>' + prompt_text_list
					  
			  }
  
				if (ave_rt > rt_thresh) {
				  feedback_text += 
					  '</p><p class = block-text>You have been responding too slowly.'
				}
			  
			  if (missed_responses > missed_thresh){
				  feedback_text +=
						  '</p><p class = block-text>You have not been responding to some trials.  Please respond on every trial that requires a response.'
			  }
			  return true
		  
		  }
	  
	  }
	  
  }
  
  
  /* create experiment definition array */
  var go_nogo_single_task_network__fmri_experiment = [];
  
  
  go_nogo_single_task_network__fmri_experiment.push(design_setup_block)
  go_nogo_single_task_network__fmri_experiment.push(motor_setup_block)
  
  test_keys(go_nogo_single_task_network__fmri_experiment, [key_choices[0][1], key_choices[1][1]])
  
  go_nogo_single_task_network__fmri_experiment.push(refreshNode)
  go_nogo_single_task_network__fmri_experiment.push(feedback_block)
  
  cni_bore_setup(go_nogo_single_task_network__fmri_experiment)
  
  go_nogo_single_task_network__fmri_experiment.push(testNode0);
  
  go_nogo_single_task_network__fmri_experiment.push(testNode);
  go_nogo_single_task_network__fmri_experiment.push(feedback_block)
  
  go_nogo_single_task_network__fmri_experiment.push(end_block)