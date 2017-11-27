'use strict';

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitIntent',
            message,
        },
    };
}
function closeSymptoms(sessionAttributes, fulfillmentState){
    let message={ contentType: 'PlainText', content:`Thank You.`  };
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}
function close(sessionAttributes, fulfillmentState, medicineName,dosageTime) {
    let message={ contentType: 'PlainText', content:`Sorry ${medicineName} is not available in my database.`  };
    
    if(dosageTime){
        if(dosageTime.toLowerCase()=='next'){
            if(medicineName.toLowerCase()=='taltz'){
                message.content=`${medicineName} should be taken at 5pm`
            }
            if(medicineName.toLowerCase()=='krokan'){
                message.content=`${medicineName} should be taken at 10pm.`
            }
            if(medicineName.toLowerCase()=='zinetac'){
                message.content=`${medicineName} should be taken taken at 11pm.`
            }       
        }
        else{
            if(medicineName.toLowerCase()=='taltz'){
                message.content=`${medicineName} was taken at 5am`
            }
            if(medicineName.toLowerCase()=='krokan'){
                message.content=`${medicineName} was taken at 3am.`
            }
            if(medicineName.toLowerCase()=='zinetac'){
                message.content=`${medicineName} was taken at 2am`
            }
        }
         
    }
    else{
        if(medicineName.toLowerCase()=='taltz'){
            message.content=`${medicineName} should be taken 2 times a day.`
        }
        if(medicineName.toLowerCase()=='krokan'){
            message.content=`${medicineName} should be taken 5 times a day.`
        }
        if(medicineName.toLowerCase()=='zinetac'){
            message.content=`${medicineName} should be taken 1 time a day.`
        }    
    }
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}
function closeFAQIntent(sessionAttributes, fulfillmentState, FAQQuestionVal) {
    let message={ contentType: 'PlainText', content:`Sorry I did not understand`  };
    
    if(FAQQuestionVal.toLowerCase()=='username'){
        message.content=`Your username should be the email account used to create your account. Please contact you companion in care for assistance with username and login details`;
    }
    else if(FAQQuestionVal.toLowerCase()=='password'){
        message.content=`You can reset your password by logging out of the application and clicking the 'Forgot Your Password?' link on the log in page.`;
    }
    else{
        
    }
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}


function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// ---------------- Helper Functions --------------------------------------------------

function parseLocalDate(date) {
    /**
     * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
     * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
     */
    const dateComponents = date.split(/\-/);
    return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
}

function isValidDate(date) {
    try {
        return !(isNaN(parseLocalDate(date).getTime()));
    } catch (err) {
        return false;
    }
}

function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

function validateCheckDosage(medicineType, dosageTime) {
    const medicineTypes = ['taltz', 'krokan', 'zinetac'];
    const dosageTimes = ['next', 'last'];
    if (medicineType && medicineTypes.indexOf(medicineType.toLowerCase()) === -1) {
        return buildValidationResult(false, 'medicineType', `I dont have ${medicineType} listed in my medicine section, may be you are looking for Taltz.`);
    }
    if(dosageTime && dosageTimes.indexOf(dosageTime.toLowerCase()) === -1){
        return buildValidationResult(false, 'medicineType', `I dont have understand what you are`);
    }
    
    return buildValidationResult(true, null, null);
}


 // --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering flowers.
 *
 * Beyond fulfillment, the implementation of this intent demonstrates the use of the elicitSlot dialog action
 * in slot validation and re-prompting.
 *
 */
function symptomsTrackerFn(intentRequest, callback) {
    var symptomsArray=[
        "vomiting",
        "fever",
        "fatigue"];
    if(intentRequest.currentIntent.slots.symptomSeverity){
        intentRequest.sessionAttributes.currentValSymptoms=parseInt(intentRequest.sessionAttributes.currentValSymptoms)+1;
        if(intentRequest.sessionAttributes.currentValSymptoms>=symptomsArray.length){
            callback(closeSymptoms(intentRequest.sessionAttributes, 'Fulfilled'));
        }
        else{
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, null, null, { contentType: 'PlainText', content: `what is the severiety of ${symptomsArray[intentRequest.sessionAttributes.currentValSymptoms]}?` }))    
        }
        
    }
    if(intentRequest.currentIntent.slots){
        if(intentRequest.currentIntent.slots.startLogSymptoms=="yes"){
            intentRequest.sessionAttributes={};
            intentRequest.sessionAttributes["currentValSymptoms"]=0;
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, null, null, { contentType: 'PlainText', content: `what is the severiety of ${symptomsArray[0]}?` }))
        }
        else if(intentRequest.currentIntent.slots.startLogSymptoms=="no"){
            
            callback(closeSymptoms(intentRequest.sessionAttributes, 'Fulfilled'));
        }
        else{
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, null, null, { contentType: 'PlainText', content: "Sure, I'll ask you to give me a level, on a scale of 0 to 3, with 0 being none and 3 being the worst, for each symptom you are tracking in your Lilly Plus app. Should We start?" }))    
        }    
    }
    else{
        intentRequest.sessionAttributes=null;
        callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, null, null, { contentType: 'PlainText', content: "Sure, I'll ask you to give me a level, on a scale of 0 to 3, with 0 being none and 3 being the worst, for each symptom you are tracking in your Lilly Plus app. Should We start?" }))    
    }
    
}

function checkFAQIntent(intentRequest, callback) {
    const FAQQuestionVal = intentRequest.currentIntent.slots.FAQQuestionVal;
    console.log(`check 1 ${FAQQuestionVal}`)
    const source = intentRequest.invocationSource;
    const outputSessionAttributes = intentRequest.sessionAttributes || {};
    
    
    callback(closeFAQIntent(intentRequest.sessionAttributes, 'Fulfilled',FAQQuestionVal));
}


 // --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'symptomTracker') {
        return symptomsTrackerFn(intentRequest, callback);
    }
    else if(intentName === 'FAQIntent'){
        return checkFAQIntent(intentRequest, callback);
    }
    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        /**
         * Uncomment this if statement and populate with your Lex bot name and / or version as
         * a sanity check to prevent invoking this Lambda function from an undesired Lex bot or
         * bot version.
         */
        /*
        if (event.bot.name !== 'symptomTracker') {
             callback('Invalid Bot Name');
        }
        */
        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};
