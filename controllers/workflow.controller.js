import { createRequire } from 'module';
import dayjs from 'dayjs';
import Subscription from "../models/subscription.model.js";
import { sendReminderEmail } from "../utils/send-email.js";
import utc from 'dayjs/plugin/utc.js';
// Initialize UTC plugin
dayjs.extend(utc);
const require = createRequire(import.meta.url);
const { serve } = require( '@upstash/workflow/express')

const REMINDERS = [7, 5, 2, 1]
export const sendReminders = serve(async (context) => {
    const { subscriptionId } = context.requestPayload;
    const subscription = await fetchSubscription(context, subscriptionId);

    if (!subscription || subscription.status !== 'active') return;

    const renewalDate = dayjs(subscription.renewalDate).utc();

    // Check if renewal has already passed
    if (renewalDate.utc().isBefore(dayjs())) {
        console.log(`Renewal date has passed for ${subscriptionId}. Stopping workflow.`);
        return;
    }

    // Process all reminders
    for (const daysBefore of REMINDERS) {
        const reminderDate = renewalDate.subtract(daysBefore, 'day');

        // 1. Check if reminder should trigger NOW (past/present)
        if (reminderDate.isSameOrBefore(dayjs(), 'day')) {
            console.log(`Triggering ${daysBefore}-day reminder immediately`);
            await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
        }
        // 2. Schedule for future
        else {
            await scheduleReminder(context, subscription, daysBefore, reminderDate);
        }
    }
});

const scheduleReminder = async (context, subscription, daysBefore, reminderDate) => {
    console.log(`Scheduling ${daysBefore}-day reminder for ${reminderDate.format()}`);

    await context.sleepUntil(
        `Reminder ${daysBefore} days before`,
        reminderDate.toDate(),
        {id: `reminder-${subscription._id}-${daysBefore}`} // Prevent duplicates
    );

    // After waking up, verify subscription is still active
    const updatedSub = await fetchSubscription(context, subscription._id);
    if (updatedSub?.status === 'active') {
        await triggerReminder(context, `${daysBefore} days before reminder`, updatedSub);
    }
};

const fetchSubscription = async (context, subscriptionId) => {
    return await context.run('get subscription', async () => {
        return Subscription.findById(subscriptionId).populate( 'user', 'name email')
    })
}




const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(`Triggering ${label} reminder`);

    await sendReminderEmail({
      to: subscription.user.email,
      type: label,
      subscription,
    })
  })
}




