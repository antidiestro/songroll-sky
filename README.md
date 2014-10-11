Songroll Sky
============

A Meteor application/experiment. Listen to music, watch videos and chat with friends and people from all over the world in real-time. Powered by the Echo Nest, YouTube and Spotify APIs.

## Installing

To run Sky locally you will need to have Meteor installed. If you don't know what Meteor is about, please check [the official Meteor site](http://www.meteor.com).

- Clone this repository.
- Copy the ```api_keys.js.example``` file on the ```/lib``` folder as ```api_keys.js``` and add your own API keys there.
- That's it! You can now run ```meteor``` on the project's folder and you're done.

## Getting my API keys

In case you don't know where to get keys for the services, here are some links with instructions:

- YouTube: [developers.google.com/youtube/v3/getting-started#intro](https://developers.google.com/youtube/v3/getting-started#intro)
- The Echo Nest: [developer.echonest.com/raw_tutorials/register.html](http://developer.echonest.com/raw_tutorials/register.html)
- Twitter: [apps.twitter.com](https://apps.twitter.com)
  * **On your app settings:**
  * Make sure to define a callback URL (if you're not sure, just use ```http://127.0.0.1:3000/_oauth/twitter?close```)
  * And make sure to check *"Allow this application to be used to Sign in with Twitter"*

## Contributing

Just build it and send me a pull request. If you're thinking about a big change, please send me an e-mail to ```rene (at) burdeo.com``` to discuss it with anticipation so you don't waste your time. If you want to do something else entirely, feel free to fork it and do as you please.