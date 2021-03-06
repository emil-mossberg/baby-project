// import { set } from "vue/types/umd";
import Vue from "vue";

export default {
  setUserProfile(state, val) {
    state.userProfile = val;
  },

  setUserLoggedIn(state, val) {
    state.userLoggedIn = val;
  },

  toggleShowGuessDate(state, val) {
    state.showGuessDate = val;
  },

  setGuessedDates(state, val) {
    state.guessedDates = val;
  },

  setLastLoadedStory(state, val) {
    state.lastLoadedStory = val;
  },

  setStories(state, val) {
    state.stories = val;
  },

  updateStories(state, val) {
    var storiesLength = state.stories.length;

    val.forEach(story => {
      Vue.set(state.stories, storiesLength, story);
      storiesLength = storiesLength + 1;
    });
  },

  updateStoryComments(state, val) {
    Vue.set(state.storiesComments, val.storyId, val.storyComments);
  },

  updateLikesOnStory(state, val) {
    const index = state.stories.findIndex(story => story.id == val.storyId);
    var copyLikes = state.stories[index].likes.slice();
    copyLikes.push(val.userId);
    Vue.set(state.stories[index], "likes", copyLikes);
  },

  removeLikesOnStory(state, val) {
    const index = state.stories.findIndex(story => story.id == val.storyId);
    var copyLikes = state.stories[index].likes.filter(id => id != val.userId);
    Vue.set(state.stories[index], "likes", copyLikes);
  },

  setLastLoadedImageUrl(state, val) {
    state.lastLoadedImageUrl = val;
  },

  setImagesUrls(state, val) {
    state.allImageUrls = val;
  },

  updateImagesUrls(state, val) {
    var imageUrlsLength = state.allImageUrls.length;

    val.forEach(imageUrl => {
      Vue.set(state.allImageUrls, imageUrlsLength, imageUrl);
      imageUrlsLength = imageUrlsLength + 1;
    });
  },

  setEditStory(state, val) {
    state.editStory = val;
  },

  setHeightsData(state, val) {
    state.heightsData = val;
  },

  setWeightsData(state, val) {
    state.weightsData = val;
  }
};
