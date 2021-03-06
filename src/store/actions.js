import * as fb from "../firebase";
import router from "../router/index";

export default {
  async login({ dispatch }, form) {
    // sign user in
    const { user } = await fb.auth.signInWithEmailAndPassword(
      form.email,
      form.password
    );

    // fetch user profile and set in state
    dispatch("fetchUserProfile", user);
  },
  async signup({ dispatch }, form) {
    // sign user up
    const { user } = await fb.auth.createUserWithEmailAndPassword(
      form.email,
      form.password
    );

    // create user object in userCollections
    await fb.usersCollection.doc(user.uid).set({
      name: form.name,
      email: form.email,
      relation: "",
      userId: user.uid
    });

    // create record that user has not guessed that yet
    await fb.guessDateCollection.doc(user.uid).set({
      guessedDate: "",
      createdOn: "",
      hasGuessedDate: false
    });

    // fetch user profile and set in state
    dispatch("fetchUserProfile", user);
  },
  async fetchUserProfile({ commit }, user) {
    // fetch user profile
    const userProfile = await fb.usersCollection.doc(user.uid).get();

    commit("setUserProfile", userProfile.data());
    commit("setUserLoggedIn", true);

    // change route to dashboard
    if (router.currentRoute.path === "/login") {
      router.push("/");
    }
  },
  async logout({ commit }) {
    // log user out
    await fb.auth.signOut();

    // clear user data from state
    commit("setUserProfile", {});
    commit("setUserLoggedIn", false);

    // redirect to login view
    router.push("/login");
  },

  async updateProfile({ dispatch }, user) {
    const userId = fb.auth.currentUser.uid;
    // eslint-disable-next-line
    const userRef = await fb.usersCollection.doc(userId).update({
      name: user.name,
      relation: user.relation
    });

    dispatch("fetchUserProfile", { uid: userId });
  },

  async fetchGuessedDate({ commit }) {
    const userId = fb.auth.currentUser.uid;
    const doc = await fb.guessDateCollection.doc(userId).get();
    commit("toggleShowGuessDate", !doc.data().hasGuessedDate);
  },

  async updateShowGuessDate({ commit }, val) {
    commit("toggleShowGuessDate", val);
  },

  // eslint-disable-next-line
  async selectGuessedDate({commit, dispatch}, guessedDate) {
    const userId = fb.auth.currentUser.uid;

    var data = {
      guessedDate: guessedDate,
      createdOn: new Date(),
      hasGuessedDate: true
    };

    await fb.guessDateCollection.doc(userId).update(data);
    dispatch("fetchGuessedDates");
  },

  async fetchGuessedDates({ commit }) {
    const docs = await fb.guessDateCollection.get();
    var datesArray = [];
    var dataArray = [];
    var yourDate = "";

    docs.forEach(doc => {
      let date = doc.data();

      if (fb.auth.currentUser.uid == doc.id) {
        yourDate = date.guessedDate;
      }
      date.id = doc.id;

      if (datesArray.includes(date.guessedDate) && date.guessedDate != "") {
        var indexElement = datesArray.indexOf(date.guessedDate);
        dataArray[indexElement] += 1;
      } else if (date.guessedDate != "") {
        datesArray.push(date.guessedDate);
        dataArray.push(1);
      }
    });

    datesArray.sort();

    // Rename this at some point
    var guessedDates = [datesArray, dataArray, yourDate];

    commit("setGuessedDates", guessedDates);
  },

  // Actions - Working with stories

  // eslint-disable-next-line
  async createStory({commit}, payload) {
    await fb.storiesContentCollection.add(payload);
  },

  async fetchStories({ commit }) {
    const first = fb.storiesContentCollection
      .orderBy("createdOn", "desc")
      .limit(8);
    var stories = [];

    const snapshot = await first.get();
    commit("setLastLoadedStory", snapshot.docs[snapshot.docs.length - 1]);

    snapshot.forEach(doc => {
      let story = doc.data();
      story.id = doc.id;
      stories.push(story);
    });

    commit("setStories", stories);
  },

  async fetchAdditionalStories({ commit, state }) {
    const next = fb.storiesContentCollection
      .orderBy("createdOn", "desc")
      .startAfter(state.lastLoadedStory.data().createdOn)
      .limit(4);
    var stories = [];

    const snapshot = await next.get();
    commit("setLastLoadedStory", snapshot.docs[snapshot.docs.length - 1]);
    snapshot.forEach(doc => {
      let story = doc.data();
      story.id = doc.id;
      stories.push(story);
    });

    commit("updateStories", stories);
  },

  async postComment({ dispatch }, comment) {
    await fb.storiesCommentsCollection.add(comment);

    dispatch("fetchComments", comment.storyId);
  },

  async fetchComments({ commit }, storyId) {
    var tempStoryComments = [];
    const docs = await fb.storiesCommentsCollection
      .where("storyId", "==", storyId)
      .get();

    docs.forEach(doc => {
      let comment = doc.data();
      comment.id = doc.id;
      tempStoryComments.push(comment);
    });

    // Investigate this and fix it, should be sorted in api-call
    var storyComments = tempStoryComments.sort((a, b) =>
      a.createdOn > b.createdOn ? 1 : -1
    );

    commit("updateStoryComments", { storyComments, storyId });
  },

  async deleteComment({ dispatch }, comment) {
    await fb.storiesCommentsCollection.doc(comment.id).delete();
    dispatch("fetchComments", comment.storyId);
  },

  // eslint-disable-next-line
  async postLikesStory({ commit, state }, storyId) {
    const story = await fb.storiesContentCollection.doc(storyId).get();
    const userId = state.userProfile.userId;
    var likesCopy = [];

    if (story.data().likes.includes(userId)) {
      likesCopy = story.data().likes.filter(id => id != userId);
      commit("removeLikesOnStory", { userId, storyId });
    } else {
      likesCopy = story.data().likes.slice();
      likesCopy.push(state.userProfile.userId);
      commit("updateLikesOnStory", { userId, storyId });
    }

    await fb.storiesContentCollection.doc(storyId).update({
      likes: likesCopy
    });
  },
  // eslint-disable-next-line
  async addImageLink({ commit }, payload) {
    await fb.allImageUrlsCollection.add({
      createdOn: payload.createdOn,
      url: payload.url
    });
  },

  async fetchImageLinks({ commit }) {
    const first = fb.allImageUrlsCollection
      .orderBy("createdOn", "desc")
      .limit(4);

    var imageLinks = [];

    const snapshot = await first.get();
    commit("setLastLoadedImageUrl", snapshot.docs[snapshot.docs.length - 1]);

    snapshot.forEach(doc => {
      let imageLink = doc.data();
      imageLink.id = doc.id;
      imageLinks.push(imageLink);
    });

    commit("setImagesUrls", imageLinks);
  },

  async fetchAdditionalImageLinks({ commit, state }) {
    const next = fb.allImageUrlsCollection
      .orderBy("createdOn", "desc")
      .startAfter(state.lastLoadedImageUrl.data().createdOn)
      .limit(2);

    var imageLinks = [];

    const snapshot = await next.get();
    commit("setLastLoadedImageUrl", snapshot.docs[snapshot.docs.length - 1]);
    snapshot.forEach(doc => {
      let imageLink = doc.data();
      imageLinks.id = doc.id;
      imageLinks.push(imageLink);
    });

    commit("updateImagesUrls", imageLinks);
  },

  async addEditStory({ commit }, data) {
    commit("setEditStory", data);
  },

  // Actions - Working with baby metrics

  // eslint-disable-next-line
  async addHeightDataPoint({ commit }, payload) {
    await fb.weightCollection.add({
      createdOn: payload.createdOn,
      weight: payload.weight
    });
  },

  async fetchHeightDataPoint({ commit }) {
    const docs = await fb.heightCollection.get();
    var heightsData = [];

    docs.forEach(doc => {
      let height = doc.data();
      height.id = doc.id;
      heightsData.push({ y: height.height, x: height.createdOn });
    });

    heightsData = heightsData.sort((a, b) => a.x - b.x);

    commit("setHeightsData", heightsData);
  },

  // eslint-disable-next-line
  async addHeightDataPoints({ commit }, payload) {
    await fb.heightCollection.add({
      createdOn: payload.createdOn,
      height: payload.height
    });
  },

  async fetchWeightDataPoint({ commit }) {
    const docs = await fb.weightCollection.get();
    var weightsData = [];

    docs.forEach(doc => {
      let weight = doc.data();
      weight.id = doc.id;

      weightsData.push({ y: weight.weight, x: weight.createdOn });
    });

    weightsData = weightsData.sort((a, b) => a.x - b.x);
    commit("setWeightsData", weightsData);
  }
};
