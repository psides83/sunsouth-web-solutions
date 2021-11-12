import emailjs from 'emailjs-com';
import moment from 'moment';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const serviceID = 'service_5guvozs';
const templateID = 'template_5dg1ys6';
const userID = 'user_3ub5f4KJJHBND1Wzl1FQi';
const timestamp = moment().format("DD-MMM-yyyy hh:mmA");

const roles = {
    request: ['admin', 'service', 'parts'],
    loaner: ['admin', 'service', 'sales']
}

// Sets recipients based on type of send email called
const setRecipients = async (recipientRoles, userProfile, salesman) => {

    if(userProfile) {

        var recipients = []
    
        const usersQuery = query(collection(db, 'users'), where('branch', '==', userProfile?.branch));
        const docSnapshot = await getDocs(usersQuery)      

        docSnapshot.docs.map((doc) => (

            recipients.push({
                salesman: `${doc.data().firstName} ${doc.data().lastName}`,
                email: doc.data().email,
                role: doc.data().role
            })
        ))

        var recipientEmails = []
        
        if (recipientRoles === roles.request) {
            recipients.filter((recipient) => recipient.salesman === salesman).map((recipient) => (

                recipientEmails.push(recipient.email)
            ))
        }

        recipients.filter((recipient) => recipientRoles.includes(recipient.role)).map((recipient) => (

            recipientEmails.push(recipient.email)
        ))

        return recipientEmails.toString().replace(/,[s]*/g, ", ")

    } else {
        console.log("no user profile")
    }
}

// Sends email when equipment is updated:
const sendEquipmentUpdateEmail = async (currentValues, request, salesman, userProfile, fullName, model, stock, serial, work, notes) => {

    // Creates the paramaters for the email template
    const recipients = await setRecipients(roles.request, userProfile, salesman)
    const subject = `UPDATED - request on model ${currentValues.model}, ${currentValues.stock}`;
    const body = `<body>
                    <section>
                        <p>${timestamp}</p>
                        <p><strong>Work Order:</strong> ${request.workOrder}</p>
                        <p><strong>Updated by:</strong> ${fullName}</p>
                    </section>
                    <hr style="height:3px;border-width:0;color:gray;background-color:gray">
                    <section>
                        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;">
                        <dl style="margin-right: 75px;">
                            <dt><h4>Previous</h4></dt>
                            <dt><strong>Model:</strong> ${currentValues.model}</dt>
                            <dt><strong>Stock Number:</strong> ${currentValues.stock}</dt>
                            <dt><strong>Serial Number:</strong> ${currentValues.serial}</dt>
                            <dt><strong>Work:</strong> ${currentValues.work}</dt>
                            <dt><strong>Notes:</strong> ${currentValues.notes}</dt>
                        </dl>
                        
                        <dl>
                            <dt><h4>Updated</h4></dt>
                            <dt><strong>Model:</strong> ${model}</dt>
                            <dt><strong>Stock Number:</strong> ${stock}</dt>
                            <dt><strong>Serial Number:</strong> ${serial}</dt>
                            <dt><strong>Work:</strong> ${work}</dt>
                            <dt><strong>Notes:</strong> ${notes}</dt>
                        </dl>
                        </div>
                    </section>
                    <body>`;

    // Sets paramaters for the email template
    const templateParams = {
        to: recipients,
        replyTo: userProfile.email,
        from: "PDI/Setup Requests",
        copy: userProfile.email,
        subject: subject,
        message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID);
    // console.log(recipients)
}

// Sends email when work order number is added or updated
const sendWorkOrderEmail = async (equipment, request, workOrder, fullName, model, userProfile, salesman) => {

    // creates the paramaters for the email template
    const recipients = await setRecipients(roles.request, userProfile, salesman)
    const subject = `UPDATED - request on model ${equipment[0]?.model}, ${equipment[0]?.stock}`;
    const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br>
                    <p>Work order # ${workOrder} has been added or updated by ${fullName} to the request on ${model} ${equipment[0]?.model}, ST# ${equipment[0]?.stock}.</p>
                    <body>`;

    // Sets paramaters for the email template
    const templateParams = {
        to: recipients,
        replyTo: userProfile.email, 
        from: "PDI/Setup Requests", 
        copy: userProfile.email,
        subject: subject,
        message: body
    };

    // sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID);
    // console.log(recipients)
}

// Sends email when equipment is added to a request from the Active Requests Table
const sendNewEquipmentEmail = async (request, equipment, timestamp, fullName, model, stock, serial, work, notes, userProfile, salesman) => {

    const recipients = await setRecipients(roles.request, userProfile, salesman)
    const subject = request.workOrder !== ''
                    ? 
                    `Equipment Added to request with WO# ${request.workOrder}`
                    :
                    `Equipment Added to previous request on ${equipment[0]?.model}, ST# ${equipment[0]?.stock}`;

    var body = `<body>
                <section>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p>
                    <p>Work Order: ${request.workOrder}</p>
                    <p>${fullName} added the following equipment to a previous request.</p>
                </section>
                <hr style="height:3px;border-width:0;color:gray;background-color:gray">
                <section>
                    <h3>Equipment</h3>
                    <p>Model: ${model}</p>
                    <p>Stock Number: ${stock}</p>
                    <p>Serial Number: ${serial}</p>
                    <p>Work Required: ${work}</p>
                    <p>Additional Notes: ${notes}</p>
                </section>
                <body>`;

    const templateParams = {
        to: recipients,
        replyTo: userProfile.email, 
        from: "PDI/Setup Requests", 
        copy: userProfile.email,
        subject: subject,
        message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID);
    // console.log(recipients)
}

// Send email when request status is updated:
const sendStatusEmail = async (status, equipment, request, fullName, userProfile, salesman) => {

    const recipients = await setRecipients(roles.request, userProfile, salesman)
    const subject = `UPDATED - Status updated to ${status} for model ${equipment[0]?.model}, ${equipment[0]?.stock}`;
    const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br> 
                    <p>The status of ${equipment[0]?.model} ST# ${equipment[0]?.stock} has been updated by ${fullName} to ${status}.</p> 
                  <body>`;

    const templateParams = {
      to: recipients,
      replyTo: userProfile.email, 
      from: "PDI/Setup Requests", 
      copy: userProfile.email,
      subject: subject,
      message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID);
    // console.log(recipients)
  }

// Sends email when new request is submitted
const sendNewRequestEmail = async (timestamp, equipmentList, fullName, userProfile, salesman) => {

    const recipients = await setRecipients(roles.request, userProfile, salesman)
    const subject = `${fullName}, ${equipmentList[0].model}, ${equipmentList[0].stock}, ${equipmentList[0].serial}`;
    var body = `<body>
                    <section>
                        <p>${timestamp}</p>
                        <p>${fullName} is requesting work to be done on the following equipment.</p>
                    </section>`;
            
    for (var i = 0; i < equipmentList.length; i++) {

        body +=  `<hr style="height:3px;border-width:0;color:gray;background-color:gray"/>
                <section>
                    <h3>Equipment ${i + 1}</h3>
                    <p>Model: ${equipmentList[i].model}</p>
                    <p>Stock Number: ${equipmentList[i].stock}</p>
                    <p>Serial Number: ${equipmentList[i].serial}</p>
                    <p>Work Required: ${equipmentList[i].work}</p>
                    <p>Additional Notes: ${equipmentList[i].notes}</p>
                </section>`
    };

    body += '</body>';

    const templateParams = {
        to: recipients,
        replyTo: userProfile.email, 
        from: "PDI/Setup Requests", 
        copy: userProfile.email,
        subject: subject,
        message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID);
    // console.log(recipients)
};

// Send email when loaner is logged.
const sendNewLoanerEmail = async (model, stock, dateOut, customer, employee, userProfile) => {

    const recipients = await setRecipients(roles.loaner, userProfile, 'none')
    const subject = `${model}, ${stock} has been loaned out`;
    const body = `<body>
                    <h2>Equipment Loaned Out</h2>
                    <dl>
                        <dt>Date Loaned: ${dateOut}</dt>
                        <dt>model: ${model}</dt>
                        <dt>Stock Number: ${stock}</dt>
                        <dt>Customer: ${customer}</dt>
                        <dt>Loaning Employee: ${employee}</dt>
                    </dl>
                </body>`;


    const templateParams = {
        to: recipients,
        replyTo: userProfile.email, 
        from: "Loaned Equipment Manager", 
        copy: userProfile.email,
        subject: subject,
        message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID)
    // console.log(recipients)
};

// Send email when request status is updated:
const sendLoanerStatusEmail = async (loaner, fullName, userProfile) => {
  
    const recipients = await setRecipients(roles.loaner, userProfile, 'none')
    const subject = `${loaner?.model}, ${loaner?.stock} has been returned`;
    const body = `<body>
                    <h2>Loaned Equipment Returned</h2>
                    <dl>
                      <dt>Date Returned: ${timestamp}</dt>
                      <dt>Model: ${loaner.model}</dt>
                      <dt>Stock Number: ${loaner?.stock}</dt>
                      <dt>Customer: ${loaner.customer}</dt>
                      <dt>Loaning Employee: ${fullName}</dt>
                    </dl>
                  </body>`;

    const templateParams = {
      to: recipients,
      replyTo: userProfile.email, 
      from: "Loaned Equipment Manager", 
      copy: userProfile.email,
      subject: subject,
      message: body
    };

    // Sends the email
    await emailjs.send(serviceID, templateID, templateParams, userID)
    // console.log(recipients)
};

export { sendEquipmentUpdateEmail, sendWorkOrderEmail, sendNewEquipmentEmail, sendStatusEmail, sendNewRequestEmail, sendNewLoanerEmail, sendLoanerStatusEmail };