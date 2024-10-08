const db = require("../models");

// This code is used for development purposes to add default events for IIIT Bhagalpur Robotics Club (Event collection) and check the API functionality
const event1 = new db.Event({
  title: "Robot Showcase",
  description:
    "This event showcases the latest robot designs developed by the IIIT Bhagalpur Robotics Club members. Visitors will be able to see and learn about various projects and innovations.",
  imageUrl:
    "https://image.shutterstock.com/image-photo/robotics-competition-260nw-123456789.jpg",
  required: 200,
  start: "2023-12-22T11:18:54.919Z",
});

const event2 = new db.Event({
  title: "Workshop on Drones",
  description:
    "A hands-on workshop focused on building and programming drones. Participants will learn the basics of drone assembly and flight control.",
  imageUrl:
    "https://image.shutterstock.com/image-photo/drone-workshop-260nw-123456789.jpg",
  required: 150,
  start: "2023-12-20T11:18:54.919Z",
});

const event3 = new db.Event({
  title: "Robotics Hackathon",
  description:
    "An exciting hackathon where participants will work in teams to design and build robots capable of performing specific tasks. This event is aimed at fostering innovation and problem-solving skills.",
  imageUrl:
    "https://image.shutterstock.com/image-photo/robotics-hackathon-260nw-123456789.jpg",
  required: 500,
  start: "2023-12-19T11:18:54.919Z",
});

const event4 = new db.Event({
  title: "AI & Robotics Conference",
  description:
    "This conference will bring together experts in AI and Robotics to discuss the latest trends and research in the field. It will include keynote speakers, panel discussions, and poster presentations.",
  imageUrl:
    "https://image.shutterstock.com/image-photo/ai-robotics-conference-260nw-123456789.jpg",
  required: 1000,
  start: "2023-12-22T11:19:54.919Z",
});

const defaultEvents = [event1, event2, event3, event4];

// Check if there are any existing events, if not, insert the default events
db.Event.find().exec(function (err, results) {
  var count = results.length;

  if (count == 0) {
    db.Event.insertMany(defaultEvents, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          "Successfully added default events to the Event collection in DB"
        );
      }
    });
  }
});

// Function to anonymize transaction IDs of sponsors
function hideTransactionID(sponsors) {
  var i, j;
  text = "";

  for (i = 0; i < sponsors.length; i++) {
    var S = sponsors[i].transactionID;
    text = "";
    for (j = 0; j < S.length; j++) {
      if (j > 3 && j < S.length - 3) text = text + "X";
      else text = text + S[j];
    }

    sponsors[i].transactionID = text;
  }

  return;
}

// Show details of a specific event by its ID
const show = async (req, res) => {
  try {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      let showEvent = await db.Event.findById(req.params.id);

      if (showEvent) {
        hideTransactionID(showEvent.sponsors);

        res.status(200).json(showEvent);
      } else {
        res.status(404).json({
          message: "Event Not Found",
        });
      }
    } else {
      res.status(404).json({
        message: "Invalid Event ID",
      });
    }
  } catch (err) {
    console.log("Server error.");
    return res.status(500).json({
      message: "Something went wrong when retrieving the event",
    });
  }
};

// Show details of all events, sorted by start date in descending order
const showAll = async (req, res) => {
  try {
    await db.Event.find({})
      .sort({ start: -1 })
      .exec(function (err, allEvents) {
        if (err) console.log(err);
        else {
          var len = allEvents.length;

          var i;
          for (i = 0; i < len; i++) {
            let currEvent = allEvents[i];
            hideTransactionID(currEvent.sponsors);
          }

          res.status(200).json(allEvents);
        }
      });
  } catch (err) {
    console.log("Server error.");
    return res.status(500).json({
      message: "Something went wrong when retrieving all events",
    });
  }
};

module.exports = {
  show,
  showAll,
};
