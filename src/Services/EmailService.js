import React from 'react'
import emailjs from 'emailjs-com'
import moment from 'moment';

// Sends email when equipment is updated:
export const sendEquipmentUpdateEmail = async (currentValues, request, fullName, model, stock, serial, work, notes, userProfile) => {

    // Creates the paramaters for the email template:
    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `UPDATED - request on model ${currentValues.model}, ${currentValues.stock}`
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
                    <body>`

    // Sets paramaters for the email template:
    const templateParams = {
        to: userProfile.email,
        replyTo: userProfile.email,
        from: "PDI/Setup Requests",
        copy: userProfile.email,
        subject: subject,
        message: body
    }

    // Sends the email:
    await emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
}

// Sends email when work order number is added or updated:
export const sendWorkOrderEmail = (equipment, request, workOrder, fullName, model, userProfile) => {

    // creates the paramaters for the email template:
    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `UPDATED - request on model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br>
                    <p>Work order # ${workOrder} has been added or updated by ${fullName} to the request on ${model} ${equipment[0]?.model}, ST# ${equipment[0]?.stock}.</p>
                    <body>`

    // Sets paramaters for the email template:
    const templateParams = {
        to: userProfile.email,
        replyTo: userProfile.email, 
        from: "PDI/Setup Requests", 
        copy: userProfile.email,
        subject: subject,
        message: body
    }

    // sends thw email:
    emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
}

// Sends email when equipment is added to a request from the Active Requests Table
export const sendNewEquipmentEmail = (request, equipment, timestamp, fullName, model, stock, serial, work, notes, userProfile) => {

    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = request.workOrder !== '' ? `Equipment Added to request with WO# ${request.workOrder}` : `Equipment Added to previous request on ${equipment[0]?.model}, ST# ${equipment[0]?.stock}`

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
    to: userProfile.email,
    replyTo: userProfile.email, 
    from: "PDI/Setup Requests", 
    copy: userProfile.email,
    subject: subject,
    message: body
    }

    emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
}

// Send email when request status is updated:
export const sendStatusEmail = async (status, equipment, request, fullName, userProfile) => {

    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `UPDATED - Status updated to ${status} for model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br> 
                    <p>The status of ${equipment[0]?.model} ST# ${equipment[0]?.stock} has been updated by ${fullName} to ${status}.</p> 
                  <body>`

    const templateParams = {
      to: userProfile.email,
      replyTo: userProfile.email, 
      from: "PDI/Setup Requests", 
      copy: userProfile.email,
      subject: subject,
      message: body
    }

    await emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
  }