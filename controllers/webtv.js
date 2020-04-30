const express = require("express");
const router = express.Router();

const PAGE_SIZE = 10;
const ETH = Math.pow(10, 18);

/**
 * Returns all photos
 * @route GET /photos
 * @group photos - Operations about photos
 * @param {string} before.query - Optional - used for pagination. Gets all photos with createdAtUTC before given timestamp
 * @returns {Array<Media>} 200 - An array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/", getVideos);

function getVideos(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  const testVideos = [
    {
      videoUrl: "https://www.youtube.com/embed/_vXTxTLTO1A",
      title: "Virginia Beach gunman resigned hours before mass shooting",
      description:
        'New details revealed about the gunman who killed 12 people at a city office in Virginia Beach, Virginia, before he was killed by police. CNN\'s Brian Todd reports he submitted a resignation letter via email, citing "personal reasons," hours before the mass shooting. #CNN #News'
    },
    {
      videoUrl: "https://www.youtube.com/embed/knbtkPy9hhg",
      title:
        "Breaking News: The New 2020 GMC Sierra HD Is Surprisingly More Affordable!",
      description:
        "Breaking News: The 2020 GMC Sierra 2500 and 3500 Heavy Duty trucks start at a lower price than 2019 models. The new Sierra HD AT4 off-road truck offers more options. "
    },
    {
      videoUrl: "https://www.youtube.com/embed/_Ju7_HxtTJs",
      title: "BREAKING: President Trump SURPRISE News Conference",
      description:
        "Sharing a mix of breaking news, Arizona stories, engaging discussions, and popular culture."
    },
    {
      videoUrl: "https://www.youtube.com/embed/zqIy-cIJlXA",
      title:
        "Breaking News: Robert Mueller Report Will Be Lightly Redacted | All In | MSNBC",
      description:
        "The Washington Post is reporting that Mueller report will be lightly redacted and will look at the question of obstruction of justice."
    },
    {
      videoUrl: "https://www.youtube.com/embed/nD5GvnOz84E",
      title:
        "Breaking News: India calls its envoy from Pakistan for consultation",
      description:
        "Ajay Bisaria, India's High Commissioner to Pakistan, has been called back to Delhi for consultations after Pulwama attack. "
    },
    {
      videoUrl: "https://www.youtube.com/embed/GYAzppyWc7o",
      title: "Breaking News: Terror attack in Srinagar, Jammu & Kashmir",
      description:
        "Terror attack took place near Zero bridge, Srinagar , J&K with the help of grenade. 6 people injured."
    },
    {
      videoUrl: "https://www.youtube.com/embed/NvqKZHpKs-g",
      title: "DW News Livestream | Latest news and breaking stories",
      description:
        "DW News goes deep beneath the surface, providing the key stories from Europe and around the world."
    },
    {
      videoUrl: "https://www.youtube.com/embed/Uyo2zpFVvoA",
      title: "Cooper stunned by Trump's comments on North Korea",
      description:
        "CNN's Anderson Cooper says President Donald Trump acts like he is a bystander to world events after Trump said it \"doesn't matter\" that North Korea conducted short-range missile tests. #CNN #News"
    },
    {
      videoUrl: "https://www.youtube.com/embed/fxOCyW-2qJ8",
      title: "Why Donald Trump is feuding with Fox News",
      description:
        "President Donald Trump's relationship with his favorite news channel, Fox News, is on the rocks. Why? They’re giving airtime to Democrats. "
    },
    {
      videoUrl: "https://www.youtube.com/embed/r1N2o1RjFJs",
      title: "Notre Dame: Priceless artefacts saved from blaze - BBC News",
      description:
        "Notre Dame Cathedral came within 30 minutes of being totally destroyed last night, according to the French government, with ministers praising the speed and bravery of firefighters."
    }
  ];

  res.send(testVideos);

  //   WebTV.find({
  //     createdAtUTC: { $lt: before }
  //   })
  //     .populate('ownerUser')
  //     .limit(PAGE_SIZE)
  //     .sort({ createdAtUTC: -1 })
  //     .then(response => {
  //       res.send(response);
  //     })
  //     .catch(error => {
  //       next(error);
  //     });
}

module.exports = router;
