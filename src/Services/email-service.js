import emailjs from "emailjs-com";
import moment from "moment";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { formatPhoneNumber } from "../utils/utils";

// const serviceID = 'service_3fgcwz9';
// const templateID = 'template_5dg1ys6';
// const userID = 'user_3ub5f4KJJHBND1Wzl1FQi';

const roles = {
  request: ["admin", "service", "parts"],
  loaner: ["admin", "service", "sales"],
};

// Sets recipients based on type of send email called
const setRecipients = async (recipientRoles, userProfile, salesman) => {
  if (userProfile) {
    var recipients = [];

    const usersQuery = query(
      collection(db, "users"),
      where("branch", "==", userProfile?.branch)
    );
    const docSnapshot = await getDocs(usersQuery);

    docSnapshot.docs.map((doc) =>
      recipients.push({
        salesman: `${doc.data().firstName} ${doc.data().lastName}`,
        email: doc.data().email,
        role: doc.data().role,
      })
    );

    var recipientEmails = [];

    if (recipientRoles === roles.request) {
      recipients
        .filter((recipient) => recipient.salesman === salesman)
        .map((recipient) => recipientEmails.push(recipient.email));
    }

    recipients
      .filter((recipient) => recipientRoles.includes(recipient.role))
      .map((recipient) => recipientEmails.push(recipient.email));

    return recipientEmails.toString().replace(/,/g, "; ");
  } else {
    console.log("no user profile");
  }
};

// Sends email when equipment is updated:
const sendEquipmentUpdateEmail = async (
  currentValues,
  request,
  userProfile,
  fullName,
  model,
  stock,
  serial,
  work,
  notes
) => {
  // Creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject = `UPDATED - request on model ${currentValues.model}, ${currentValues.stock}`;
  const body = `<body>
                    <section>
                        <p>${timestamp}</p>
                        <p><strong>Work Order:</strong> ${request.workOrder}</p>
                        <p><strong>Updated by:</strong> ${fullName}</p>
                    </section>
                    <hr style="height:3px;border-width:0;color:gray;background-color:gray">
                    <section>
                        <div style="display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: center;">
                        <dl style="margin-right: 80px;">
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
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // Sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Sends email when work order number is added or updated
const sendWorkOrderEmail = async (
  equipment,
  request,
  workOrder,
  fullName,
  model,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject = `UPDATED - request on model ${equipment[0]?.model}, ${equipment[0]?.stock}`;
  const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br>
                    <p>Work order # ${workOrder} has been added or updated by ${fullName} to the request on ${model} ${equipment[0]?.model}, ST# ${equipment[0]?.stock}.</p>
                <body>`;

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Sends email when equipment is added to a request from the Active Requests Table
const sendNewEquipmentEmail = async (
  request,
  equipment,
  timestamp,
  fullName,
  model,
  stock,
  serial,
  work,
  notes,
  userProfile
) => {
  console.log(equipment);

  // creates the paramaters for the email template
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject =
    request.workOrder !== ""
      ? `Equipment Added to request with WO# ${request.workOrder}`
      : `Equipment Added to previous request on ${equipment[0]?.model}, ST# ${equipment[0]?.stock}`;

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

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    // to: "psides83@hotmail.com",
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when request status is updated:
const sendStatusEmail = async (
  status,
  equipment,
  request,
  fullName,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject = `UPDATED - Status updated to ${status} for model ${equipment[0]?.model}, ${equipment[0]?.stock}`;
  const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br> 
                    <p>The status of ${equipment[0]?.model} ST# ${equipment[0]?.stock} has been updated by ${fullName} to ${status}.</p> 
                <body>`;

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when Equipment is deleted:
const sendEquipmentDeletedEmail = async (
  equipment,
  request,
  userFullName,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject = `DELETED - ${equipment.model}, ${equipment.stock} from setup request`;
  const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br> 
                    <p>${equipment.model} ST# ${equipment.stock} has been removed from this request by ${userFullName}.</p> 
                <body>`;

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    // to: "psides83@hotmail.com",
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when request is deleted:
const sendRequestDeletedEmail = async (
  equipment,
  request,
  userFullName,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(
    roles.request,
    userProfile,
    request.salesman
  );
  const subject =
    request.workOrder !== ""
      ? `DELETED - Request on WO# ${request.workOrder} with ${equipment[0].model}`
      : `DELETED - Request on ${equipment[0].model}, ST# ${equipment[0].stock}`;
  const body = `<body>
                    <p>${timestamp}</p>
                    <p>Request ID: ${request.id}</p><br> 
                    <p>Request on ${equipment.model} ST# ${equipment.stock} has been deleted by ${userFullName}.</p> 
                <body>`;

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    // to: "psides83@hotmail.com",
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Sends email when new request is submitted
const sendNewRequestEmail = async (
  timestamp,
  equipmentList,
  fullName,
  userProfile,
  salesman
) => {
  // creates the paramaters for the email template
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(roles.request, userProfile, salesman);
  const subject = `${fullName}, ${equipmentList[0].model}, ${equipmentList[0].stock}, ${equipmentList[0].serial}`;
  var body = `<body>
                    <section>
                        <p>${timestamp}</p>
                        <p>${fullName} is requesting work to be done on the following equipment.</p>
                    </section>`;

  for (var i = 0; i < equipmentList.length; i++) {
    body += `<hr style="height:3px;border-width:0;color:gray;background-color:gray"/>
                <section>
                    <h3>Equipment ${i + 1}</h3>
                    <p>Model: ${equipmentList[i].model}</p>
                    <p>Stock Number: ${equipmentList[i].stock}</p>
                    <p>Serial Number: ${equipmentList[i].serial}</p>
                    <p>Work Required: ${equipmentList[i].work}</p>
                    <p>Additional Notes: ${equipmentList[i].notes}</p>
                </section>`;
  }

  body += "</body>";

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "PDI/Setup Requests<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when loaner is logged.
const sendNewLoanerEmail = async (
  model,
  stock,
  dateOut,
  customer,
  employee,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(roles.loaner, userProfile, "none");
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

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "Loaned Equipment Manager<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when request status is updated:
const sendLoanerStatusEmail = async (loaner, fullName, userProfile) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  const recipients = await setRecipients(roles.loaner, userProfile, "none");
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

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: "Loaned Equipment Manager<sunsouth.auburn@gmail.com>",
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Sends email when new request is submitted
const sendNewTransportRequestEmail = async (
  timestamp,
  transportRequest,
  fullName,
  userProfile,
  salesman
) => {
  // creates the paramaters for the email template
  const emailID = moment().format("yyyyMMDDHHmmss");
  // const recipients = await setRecipients(roles.request, userProfile, salesman);
  const recipients = "psides@sunsouth.com";
  const subject = `New equipment ${transportRequest.type} request from ${fullName}`;
  var body = `<body>
                    <section>
                        <p>${timestamp}</p>
                        <p>${fullName} is requesting ${
    transportRequest.requestType
  } of equipment ${
    transportRequest.requestType === "Delivery" ? "to" : "from"
  } the customer below.</p>
                    </section>
                    <section>
                        <h3>${
                          transportRequest.requestType
                        } Date Requested: ${moment(
    transportRequest.requestedDate
  ).format("DD-MMM-yyyy")}</h3>
                        <p>Customer: ${transportRequest.customerName}</p>
                        <p>Phone: ${formatPhoneNumber(
                          transportRequest.customerPhone
                        )}</p>
                        <p>Address:</p>
                        <p>${transportRequest.customerStreet}</p>
                        <p>${transportRequest.customerCity}, ${
    transportRequest.customerState
  } ${transportRequest.customerZip}</p>
                    </section>
                    `;

  for (var i = 0; i < transportRequest.equipment.length; i++) {
    body += `<hr style="height:3px;border-width:0;color:gray;background-color:gray"/>
                <section>
                    <h3>Equipment ${i + 1}</h3>
                    <p>Model: ${transportRequest.equipment[i].model}</p>
                    <p>Stock Number: ${transportRequest.equipment[i].stock}</p>
                    <p>Serial Number: ${
                      transportRequest.equipment[i].serial
                    }</p>
                    <p>Additional Notes: ${
                      transportRequest.equipment[i].notes
                    }</p>
                </section>`;
  }

  body += "</body>";

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: `Equipment Transport - ${userProfile.branch}<sunsouth.auburn@gmail.com>`,
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body,
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// Send email when request status is updated:
const sendTransportStatusEmail = async (
  status,
  startDate,
  endDate,
  transportRequest,
  fullName,
  userProfile
) => {
  // creates the paramaters for the email template
  const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
  const emailID = moment().format("yyyyMMDDHHmmss");
  // const recipients = await setRecipients(
  //   roles.request,
  //   userProfile,
  //   transportRequest.salesman
  // );
  const recipients = "psides@sunsouth.com";
  const equipment = () => {
    const models = [];
    for (var i = 0; i < transportRequest.equipment.length; i++) {
      models.push(transportRequest.equipment[i].model);
    }

    return models.toString().replace(/,/g, ", ");
  };
  const subject = `UPDATED - ${transportRequest.requestType} status updated to ${status} for customer ${transportRequest.customerName}`;
  const body = () => {
    if (status === "Scheduled") {
      return `<body>
                    <p>${timestamp}</p>
                    <p><strong>Work Order:</strong> ${transportRequest.workOrder}</p>
                    <p><strong>Customer:</strong> ${transportRequest.customerName}</p>
                    <p><strong>Equipment:</strong> ${equipment()}</p>
                    <p><strong>${transportRequest.requestType} Status:</strong> ${status}</p>
                    <p><strong>Scheduled ${transportRequest.requestType} Date:</strong> ${moment(
        startDate
      ).format("DD-MMM-yyyy")}</p>
                    <p>Scheduled ${transportRequest.requestType} Time Window: ${moment(
        startDate
      ).format("LT")} - ${moment(endDate).format("LT")}</p>
                    <p>Updated By: ${fullName}</p>
                <body>`;
    }

    if (status === "In Progress" || status === "Completed") {
      return `<body>
                  <p>${timestamp}</p>
                  <p><strong>Work Order:</strong> ${transportRequest.workOrder}</p>
                  <p><strong>Customer:</strong> ${transportRequest.customerName}</p>
                  <p><strong>Equipment:</strong> ${equipment()}</p>
                  <p><strong>${transportRequest.requestType} Status:</strong> ${status}</p>
                  <p><strong>Updated By:</strong> ${fullName}</p>
              <body>`;
    }
  };

  // Sets paramaters for the email template
  const emailData = {
    to: recipients,
    replyTo: userProfile.email,
    from: `Equipment Transport - ${userProfile.branch}<sunsouth.auburn@gmail.com>`,
    cc: userProfile.email,
    replyTo: userProfile.email,
    message: {
      subject: subject,
      html: body(),
    },
  };

  // sends the email
  await setDoc(doc(db, "sentEmails", emailID), emailData);
  // console.log(recipients)
};

// TODO add emails for transport feature

export {
  sendEquipmentUpdateEmail,
  sendWorkOrderEmail,
  sendNewEquipmentEmail,
  sendStatusEmail,
  sendNewRequestEmail,
  sendNewLoanerEmail,
  sendLoanerStatusEmail,
  sendEquipmentDeletedEmail,
  sendRequestDeletedEmail,
  sendNewTransportRequestEmail,
  sendTransportStatusEmail,
};
