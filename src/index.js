/* eslint-disable no-use-before-define */
/* global firebase,  */

const firebaseConfig = {
  apiKey: 'AIzaSyDE9O_Vdf00nik85EupWYgHorTDKgmqmes',
  authDomain: 'my-library-project-8cc42.firebaseapp.com',
  databaseURL: 'https://my-library-project-8cc42.firebaseio.com',
  projectId: 'my-library-project-8cc42',
  storageBucket: 'my-library-project-8cc42.appspot.com',
  messagingSenderId: '600577021676',
  appId: '1:600577021676:web:b3f907c0d0d51aad43b7c9',
  measurementId: 'G-PGBPKN3WHY',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const dbRef = firebase.database().ref();


function Auth() {
  this.signUp = () => {
    function signUserUp() {
      const [emailAdd, password] = [document.getElementById('email'), document.getElementById('password')];

      firebase.auth().createUserWithEmailAndPassword(emailAdd.value, password.value).then(() => {
        const user = firebase.auth().currentUser;
        const [email, username, favouriteBooks, bookmarkBooks, readBooks, currentRead] = [user.email, user.email.split('@')[0], '0', '0', { book_id: '0', book_page: '0' }, '0'];
        const userInfo = {
          email,
          username,
          favouriteBooks,
          bookmarkBooks,
          readBooks,
          currentRead,
        };
        firebase.database().ref(`users/${user.uid}`).push(userInfo);
        // location.reload();
        document.getElementById('sign-up-form-content').reset();
        const ui = new UI();
        ui.displayMessage(`Welcome ${username}, you are now a Libb member!`);

      }).catch((error) => {
        document.getElementById('signup-error-msg').innerText = error.message;
      });
    }
    const signUpButton = document.getElementById('sign-up-btn');
    signUpButton.addEventListener('click', signUserUp);
  };

  this.signOut = () => {
    function signUserOut() {
      firebase.auth().signOut().then(() => {
        window.localStorage.setItem('page_link', 'discover');
        const ui = new UI();
        ui.displayViewContent('#app-links .get-link', 'discover');
      }).catch((error) => {
        console.log(error);
      });
    }
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', signUserOut);
  };

  this.signIn = () => {
    function signUserIn() {
      const [loginEmail, loginPassword] = [document.getElementById('login-email'), document.getElementById('login-password')];

      firebase.auth().signInWithEmailAndPassword(loginEmail.value, loginPassword.value).then(() => {
        document.getElementById('sign-in-form-content').reset();
        const user = firebase.auth().currentUser;
        firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const userProfile = snapShot.val();
            // location.reload()
            const ui = new UI();
            ui.displayMessage(`Welcome back ${userProfile.username}`);
          });
        });
      })
        .catch((error) => {
          document.getElementById('login-error-msg').innerHTML = `<p class="login-error-msg text-danger">${error.message}</p>`;
          setTimeout(() => {
            document.querySelector('.login-error-msg').remove();
          }, 5000);
        });
    }

    const signInButton = document.getElementById('log-in-btn');
    signInButton.addEventListener('click', signUserIn);
  };

  this.userIsSignedIn = () => {
    const ui = new UI();

    firebase.auth().onAuthStateChanged((user) => {
      if (user !== null) {
        firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const userProf = snapShot.val();
            document.querySelector('.user-profile').innerHTML = `
            <img src="${userProf.photoURL}" alt="Profile Image">
            <span class="username ml-3">${userProf.username.toUpperCase()}</span>`;
          });
        });
        ui.hideDisplayContent('app-container', 'login-form');
      } else {
        ui.hideDisplayContent('login-form', 'app-container');
      }
    });
  };
}


function Book() {
  this.addBookToStore = () => {
    const addBookList = document.getElementById('addBookListBtn');

    const ui = new UI();
    ui.toggleReadCheckBox('read', 'read-text');

    addBookList.addEventListener('click', (e) => {
      const addBookListForm = document.querySelectorAll('#addBookListForm .form-control');

      const addedBookValue = {};
      Array.from(addBookListForm).forEach((textField) => {
        const key = textField.getAttribute('data-key');
        let value = '';
        if (key === 'read') {
          value = textField.checked;
        } else if (key === 'book_image') {
          value = document.getElementById('book-image').files;
        } else {
          value = document.getElementById(textField.id).value;
        }
        addedBookValue[key] = value;
      });

      const validateForm = Object.values(addedBookValue).filter((item) => item === '' || item === undefined);
      const validateFormKey = Object.keys(addedBookValue).filter((item) => addedBookValue[item] === '' || addedBookValue[item] === undefined);

      if (validateFormKey.length >= 1) {
        for (let i = 0; i < validateForm.length; i += 1) {
          const dataKey = validateFormKey[i];
          const msgError = document.getElementById(`msg-${dataKey}`);

          const ui = new UI();
          ui.formErrorMsg(msgError, '<small id="error-msg">Required Field</small>', 'error-msg');
        }
      } else {
        const bookImage = document.getElementById('book-image').files[0];
        const storageRef = firebase.storage().ref().child(bookImage.name);
        const uploadImage = storageRef.put(bookImage);

        uploadImage.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          document.querySelector('.gif-loader').style.display = 'flex';
          document.querySelector('.upload-percent').innerText = `${parseInt(progress, 10)}%...`;
        }, (error) => {
          // eslint-disable-next-line no-console
          console.log(error.message);
        }, () => {
          uploadImage.snapshot.ref.getDownloadURL().then((downloadURL) => {
            const helpers = new HelperMethod();
            const user = firebase.auth().currentUser;
            addedBookValue.book_image = downloadURL;
            addedBookValue.votes = 0;
            addedBookValue.reviewers = '0';
            addedBookValue.created_at = helpers.getDate();
            addedBookValue.added_by = user.uid;

            const bookListsRef = dbRef.child('addbook');
            bookListsRef.push(addedBookValue, () => {
              location.reload();
              const localStorage = new LocalStorage();
              localStorage.changePage('discover');
            });
          });
        });
      }
      e.preventDefault();
    });
  };

  this.editBookList = () => {
    const editBookList = document.getElementById('editBookListBtn');
    editBookList.addEventListener('click', (e) => {
      const bookID = document.querySelector('#edit-book-usid').value;
      const bookRef = dbRef.child(`addbook/${bookID}`);

      const editBookListForm = document.querySelectorAll('#editBookListForm .form-control');
      const editedBookValue = {};
      const bookImage = document.querySelector('#edit-book-image').files[0];
      editBookListForm.forEach((textField) => {
        const key = textField.getAttribute('data-key');
        const { value } = textField;
        if (key === 'read') {
          editedBookValue[key] = textField.checked;
        } else if (key === 'book_image') {
          editedBookValue[key] = document.querySelector('.edit-book-cover').getAttribute('src');
        } else {
          editedBookValue[key] = value;
        }
      });
      if (bookImage !== undefined) {
        const storageRef = firebase.storage().ref().child(bookImage.name);
        const uploadTask = storageRef.put(bookImage);

        uploadTask.on('state_changed', (snapshot) => {
        }, (error) => {
        }, () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            editedBookValue.book_image = downloadURL;
            bookRef.update(editedBookValue, () => {
              location.reload();
            });
          });
        });
      } else {
        bookRef.update(editedBookValue, () => {
          location.reload();
        });
      }
      e.preventDefault();
    });
  };

  this.getAllBooksFromStore = (snapshot) => {
    const arr = [];
    snapshot.forEach((childSnapshot) => {
      const childKey = childSnapshot.key;
      const childData = childSnapshot.val();
      const data = childData;
      data.uid = childKey;
      arr.push(data);
    });
    // arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // arr.sort((a, b) => a.genre - b.genre);
    return arr;
  };

  this.addAllBooksToDOM = (sorted) => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const addBookToContent = document.querySelector('.all-books .content');
      const addManagedBookToYourContent = document.querySelector('#managed-books #your-collection .content');
      const addManagedBookToOtherContent = document.querySelector('#managed-books #other-collection .content');
      const addTopBookToContent = document.querySelector('.top-reads #slideshow');

      const pushArrAll = this.getAllBooksFromStore(snapshot);
      const pushArrManaged = this.getAllBooksFromStore(snapshot);
      const pushArrTopReads = this.getAllBooksFromStore(snapshot);
      pushArrAll.sort(sorted);
      pushArrTopReads.sort((a, b) => a.votes - b.votes);

      const userId = firebase.auth().currentUser;
      let favouriteReads; let bookmarkReads; let readReads;
      if (userId !== null) {
        firebase.database().ref(`users/${userId.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const childData = snapShot.val();
            const helper = new HelperMethod();
            favouriteReads = childData.favouriteBooks;
            bookmarkReads = childData.bookmarkBooks;
            readReads = childData.readBooks;

            let node = '';
            pushArrAll.forEach((item) => {
              let favouriteIcons; let bookmarkIcons;
              if (favouriteReads.split(',').indexOf(item.uid) >= 0) {
                favouriteIcons = 'fas fa-heart liked-reads';
              } else {
                favouriteIcons = 'far fa-heart unliked-reads';
              }
              if (bookmarkReads.split(',').indexOf(item.uid) >= 0) {
                bookmarkIcons = 'fas fa-bookmark booked-reads';
              } else {
                bookmarkIcons = 'far fa-bookmark unbooked-reads';
              }
              node += `<div class="item text-center ${item.genre}" data-category="${item.genre}">
                <div class="item-image">
                  <img class="img"
                    src="${item.book_image}"
                    alt="${item.title}">

                  <div class="like-icons">
                    <i class="${favouriteIcons} favourite-icon" id="like-icon-${item.uid}" data-like="${item.uid}"></i>
                    <i class="${bookmarkIcons} bookmark-icon" id="bookmark-icon-${item.uid}" data-bookmark="${item.uid}"></i>
                  </div>
                  
                  <div class="book-icons">
                    <span class="icons review-icon" id="review-icon-${item.uid}" data-review="${item.uid}">Reviews</span>
                    <span class="icons read-button" id="read-button-${item.uid}" data-toggle="modal" data-target="#bookModal" data-id="${item.uid}">Read</span>
                  </div>
                </div>
                <div class="info mt-1">
                  <h5>${helper.stringLength(item.title, 20)}</h5>
                  <p>By ${item.author}</p>
                </div>
                </div>`;
            });

            addBookToContent.innerHTML = node;

            pushArrTopReads.slice(0, 4).forEach((item, index) => {
              const nodeTop = document.createElement('div');
              nodeTop.classList = `items items-${index}`;
              nodeTop.innerHTML = `
              <div class="item">
                <div class="top-read-image">
                  <img class="image" src="${item.book_image}" alt="book-cover">
                </div>
                <div class="info">
                  <div class="row no-gutters">
                    <div class="col-6"></div>
                    <div class="col-6 mt-3 pr-2">
                      <h5>${helper.stringLength(item.title, 20)}</h5>
                      <small><strong>By ${item.author}</strong></small>
                      <p>${helper.stringLength(item.description, 65)}
                      </p>
                      <div>
                      <a href="${item.booklink}" class="button">See the book</a>
                      </div>
                    </div>
                  </div>

                </div>
              </div>`;

              addTopBookToContent.appendChild(nodeTop);
            });

            pushArrManaged.forEach((item) => {
              let nodeManaged = document.createElement('div');
              let readIcons; let checkIcon; let readStatus;
              if (readReads.split(',').indexOf(item.uid) >= 0) {
                readIcons = 'cover cover-hover';
                checkIcon = '<i class="fas fa-check"></i>';
                readStatus = 'Read';
              } else {
                readIcons = 'cover cover-unhover';
                checkIcon = '';
                readStatus = 'Unread';
              }

              let addIfUser = `
              <div class="managed-icons">
                <i class="fas fa-edit color-primary edit-icon" data-toggle="modal" data-target="#editBookModalLong" data-id="${item.uid}"></i>
                <i class="fas fa-times-circle text-danger delete-icon" data-delete="${item.uid}" id="delete-book-${item.id}"></i>
              </div>`;

              nodeManaged.classList = 'managed-content text-center';
              if (userId.uid == item.added_by) {
                nodeManaged.innerHTML = `
                  <div class= "position-relative">
                    <img class="img-fluid cover-img"
                      src="${item.book_image}"
                      alt="book-cover" />
                    <div class="hovered-content">
                      <div class="${readIcons} read-icon" id="read-book-${item.uid}" data-read="${item.uid}"> ${readStatus} ${checkIcon}</div>
                    </div>
                  </div>
                  ${addIfUser}
                  <h5>${item.title}</h5>`;
                addManagedBookToYourContent.append(nodeManaged);

              } else {
                nodeManaged.innerHTML = `
                  <div class= "position-relative">
                    <img class="img-fluid cover-img"
                      src="${item.book_image}"
                      alt="book-cover" />
                    <div class="hovered-content">
                      <div class="${readIcons} read-icon" id="read-book-${item.uid}" data-read="${item.uid}"> ${readStatus} ${checkIcon}</div>
                    </div>
                  </div>
                  <h5>${item.title}</h5>`;
                addManagedBookToOtherContent.append(nodeManaged);
              }

            });

            const ui = new UI();
            ui.toggleReadBtn();
            book.showEditBookModal();
            book.deleteBook();
            book.showReadBookModal(pushArrAll);
            ui.slideshow();
          });
        });
      } else {
        favouriteReads = '';
        bookmarkReads = '';
        readReads = '';
      }
    });
  };

  this.addBookmarkToDom = (pageToAdd, storedBook) => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const book = new Book();
      const pushArr = book.getAllBooksFromStore(snapshot);

      const mappedStoredBook = storedBook === undefined ? '' : storedBook.split(',');
      let addBooks = '';
      const helpers = new HelperMethod();
      pushArr.filter((item) => mappedStoredBook.includes(item.uid)).forEach((item) => {
        addBooks += `<div class="item">
          <img class="img-fluid"
            src="${item.book_image}"
            alt="book-cover" />
          <div class="info">
            <div class="row no-gutters">
              <div class="col-5"></div>
              <div class="col-7 px-3 mt-3">
                <h5 class="title">${item.title}</h5>
                <span>By ${item.author}</span>
                <p class="mt-2">${helpers.stringLength(item.description, 65)}</p>
                <a href="${item.booklink}" class="button">See the book</a>
              </div>
            </div>

          </div>
        </div>`;
      });
      document.querySelector(pageToAdd).innerHTML = addBooks;

      // book.showReadBookModal(pushArr);
      book.showReviewWhenClicked(pushArr);
    });
  };

  this.checkFavouriteBooks = () => {
    firebase.database().ref('addbook').once('value', () => {
      const user = firebase.auth().currentUser;
      let favouriteReads; let bookmarkReads;
      if (user !== null) {
        firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const childData = snapShot.val();
            const { key } = snapShot;
            favouriteReads = childData.favouriteBooks;
            bookmarkReads = childData.bookmarkBooks;

            const book = new Book();
            book.addBookmarkToDom('#favourite-books', favouriteReads);
            book.addBookmarkToDom('#bookmarked-books', bookmarkReads);
            const favouriteBookSplited = favouriteReads.split(',');
            const bookmarkBookSplited = bookmarkReads.split(',');

            document.addEventListener('click', (e) => {
              if (e.target.classList.contains('favourite-icon')) {
                const { id } = e.target;
                const ele = document.querySelector(`#${id}`);
                const likeId = ele.getAttribute('data-like');

                if (ele.classList.contains('unliked-reads')) {
                  ele.classList.add('liked-reads', 'fas');
                  ele.classList.remove('unliked-reads', 'far');
                  favouriteBookSplited.push(likeId);
                } else if (ele.classList.contains('liked-reads')) {
                  ele.classList.add('unliked-reads', 'far');
                  ele.classList.remove('liked-reads', 'fas');
                  favouriteBookSplited.splice(favouriteBookSplited.indexOf(likeId), 1);
                }

                favouriteReads = favouriteBookSplited.join(',');

                const userReff = dbRef.child(`users/${user.uid}/${key}`);
                userReff.update(
                  { favouriteBooks: favouriteReads },
                );
                book.addBookmarkToDom('#favourite-books', favouriteReads);
              }
            });

            document.addEventListener('click', (e) => {
              if (e.target.classList.contains('bookmark-icon')) {
                const { id } = e.target;
                const ele = document.querySelector(`#${id}`);
                const bookmarkId = ele.getAttribute('data-bookmark');
                if (ele.classList.contains('unbooked-reads')) {
                  ele.classList.add('booked-reads', 'fas');
                  ele.classList.remove('unbooked-reads', 'far');
                  bookmarkBookSplited.push(bookmarkId);
                } else if (ele.classList.contains('booked-reads')) {
                  ele.classList.add('unbooked-reads', 'far');
                  ele.classList.remove('booked-reads', 'fas');
                  bookmarkBookSplited.splice(bookmarkBookSplited.indexOf(bookmarkId), 1);
                }

                bookmarkReads = bookmarkBookSplited.join(',');

                const userReff = dbRef.child(`users/${user.uid}/${key}`);
                userReff.update(
                  { bookmarkBooks: bookmarkReads },
                );
                book.addBookmarkToDom('#bookmarked-books', bookmarkReads);
              }
            });
          });
        });
      } else {
        favouriteReads = '';
        bookmarkReads = '';
      }
    });
  };

  this.showReadBookModal = (pushArr) => {
    document.querySelectorAll('.read-button').forEach((item) => {
      const { id } = item;
      document.querySelector(`#${id}`).addEventListener('click', () => {
        const dataId = document.querySelector(`#${id}`).getAttribute('data-id');
        const filteredData = pushArr.filter((itemfil) => itemfil.uid === dataId);
        const votes = filteredData[0].votes <= 1 ? `${filteredData[0].votes} vote` : `${filteredData[0].votes} votes`;
        let reviews = filteredData[0].reviewers.split(',').length - 1;
        reviews = reviews <= 1 ? `${reviews} review` : `${reviews} reviews`;

        const helpers = new HelperMethod();
        const modalContent = document.querySelector('.modal .modal-body .content');
        modalContent.innerHTML = `
        <div class="row no-gutters m-0 h-100">
          <div class="col-8 m-auto m-md-0 col-md-6 p-0">
            <div class="image h-100">
              <img
                src="${filteredData[0].book_image}"
                alt="${filteredData[0].title}">
            </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="info text-center">
                <h6>${filteredData[0].title}</h6>
                <p class="d-flex justify-content-between modal-reviews">
                 <span> <span class="fas fa-star modal-star-checked"></span> &nbsp;${votes}</span>
                  <span>${reviews}</span>
                  <span>${filteredData[0].num} pages</span>
                </p>
                <div class="mb-4">
                  <a href="${filteredData[0].booklink}" class="button">Read the book</a>
                </div>

                <p>${helpers.stringLength(filteredData[0].description, 300)}</p>
              </div>
            </div>
          </div>`;
      });
    });
  };

  this.showEditBookModal = () => {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-icon')) {
        const id = e.target.getAttribute('data-id');
        const bookRef = dbRef.child(`addbook/${id}`);
        document.querySelector('#hidden-field').innerHTML = `<input type="hidden" value="${id}" id="edit-book-usid">`;
        const editBookListForm = document.querySelectorAll('#editBookListForm .form-control');

        bookRef.on('value', (snap) => {
          for (let i = 0, len = editBookListForm.length; i < len; i += 1) {
            if (editBookListForm[i].getAttribute('data-key') === 'read') {
              const read = editBookListForm[i].getAttribute('data-key');
              editBookListForm[i].checked = snap.val()[read];
              const ui = new UI();
              ui.toggleEditReadCheckBox();
            } else if (editBookListForm[i].getAttribute('data-key') === 'book_image') {
              const bookImage = editBookListForm[i].getAttribute('data-key');
              document.querySelector('#edit-display-img').innerHTML = `<img src = "${snap.val()[bookImage]}" class="edit-book-cover">`;
            } else {
              const key = editBookListForm[i].getAttribute('data-key');
              editBookListForm[i].value = snap.val()[key];
            }
          }
        });
      }
    });
  };

  this.showReviewWhenClicked = (pushArr) => {
    document.querySelectorAll('.review-icon').forEach((item) => {
      const { id } = item;
      document.querySelector(`#${id}`).addEventListener('click', () => {
        const dataReview = document.querySelector(`#${id}`).getAttribute('data-review');

        const localStorage = new LocalStorage();
        const storedReviewId = localStorage.setReviewId(dataReview);

        firebase.database().ref(`addbook/${storedReviewId}`).once('value', (snap) => {
          let reviewerIdArray = snap.val().reviewers;
          reviewerIdArray = reviewerIdArray.split(',');
          const userInfo = firebase.auth().currentUser;
          if (userInfo != null) {
            if (reviewerIdArray.includes(userInfo.uid)) {
              document.querySelector('.read-review').innerHTML = '<h5 class="text-white text-center">You have already have a review for this book!</h5>';
            } else {
              document.querySelector('.read-review').innerHTML = `<div class="row no-gutters align-items-end">
              <div class="col-10">
                <div class="star-rating mb-2">
                  <p class="text-white mb-0">Rate Book</p>
                  <span class="fa fa-star checked star-icon" id="rate-1" rate-id="1"></span>
                  <span class="fa fa-star star-icon" id="rate-2" rate-id="2"></span>
                  <span class="fa fa-star star-icon" id="rate-3" rate-id="3"></span>
                  <span class="fa fa-star star-icon" id="rate-4" rate-id="4"></span>
                  <span class="fa fa-star star-icon" id="rate-5" rate-id="5"></span>
                </div>

                <input type="text" id="review-title" class="review-input w-100 mb-3" placeholder="Review Title">
                <textarea class="review-input scroll-bar w-100" id="review-comment"
                  placeholder="Write a review"></textarea>
              </div>
              <div class="col-2">
                <button type="submit" class="review-btn" id="add-review-btn">
                  <i class="fa fa-paper-plane fa-2x ml-3"></i>
                </button>
              </div>
            </div>`;
            }
          }
        });

        const filteredReviewedBook = pushArr.filter((itemfil) => itemfil.uid === storedReviewId);
        document.querySelector('.book-reviewed-title').innerText = filteredReviewedBook[0].title;
        document.querySelector('.review-content .hidden-id').innerHTML = `<input type="hidden" value="${storedReviewId}" id="review-id">`;

        firebase.database().ref('addreview').once('value', (snap) => {
          const pushedReview = [];
          snap.forEach((childSnapshot) => {
            const childData = childSnapshot.val();
            pushedReview.push(childData);
          });

          const ui = new UI();
          ui.populateReview(pushedReview);
        });
      });

      const storedReviewId = window.localStorage.getItem('review_id');
      const filteredReviewedBook = pushArr.filter((itemfil) => itemfil.uid === storedReviewId);
      document.querySelector('.book-reviewed-title').innerText = filteredReviewedBook[0].title;
      document.querySelector('.review-content .hidden-id').innerHTML = `<input type="hidden" value="${storedReviewId}" id="review-id">`;

      firebase.database().ref(`addbook/${storedReviewId}`).once('value', (snap) => {
        let reviewerIdArray = snap.val().reviewers;
        reviewerIdArray = reviewerIdArray.split(',');
        const userInfo = firebase.auth().currentUser;
        if (userInfo != null) {
          if (reviewerIdArray.includes(userInfo.uid)) {
            document.querySelector('.read-review').innerHTML = '<h5 class="text-center text-white">You already have a review for this book!</h5>';
          }
        }
      });
    });
  };

  this.deleteBook = () => {
    document.querySelectorAll('.delete-icon').forEach((item) => {
      const { id } = item;
      document.getElementById(`${id}`).addEventListener('click', () => {
        // eslint-disable-next-line no-alert
        const result = confirm('Are you sure you want to delete this book?');
        if (result) {
          this.parentElement.parentElement.remove();
          const userID = this.getAttribute('data-delete');
          const userRef = dbRef.child(`addbook/${userID}`);
          userRef.remove();
        }
      });
    });
  };

  this.saveCurrentReadToStore = () => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const pushArr = this.getAllBooksFromStore(snapshot);
      const currentReadSelect = document.getElementById('current-read');

      let bookTitle = '<option value="" disabled selected>Current Read</option>';
      pushArr.forEach((item) => {
        bookTitle += `<option value="${item.uid}"> ${item.title}</option>`;
      });
      currentReadSelect.innerHTML = bookTitle;

      let selectedRead;
      currentReadSelect.addEventListener('change', () => {
        const options = currentReadSelect.options[currentReadSelect.selectedIndex].value;
        const helper = new HelperMethod();

        selectedRead = pushArr.filter((item) => item.uid === options);
        document.getElementById('set-current-read').innerHTML = `
        <div class="row no-gutters">
          <div class="col-10">
            <h2>${helper.stringLength(selectedRead[0].title, 20)}</h2>
            <small>By ${selectedRead[0].author}</small>
          </div>
          <div class="col-2">
            <div class="current-read-image">
              <img src="${selectedRead[0].book_image}" alt="${selectedRead[0].title}">
            </div>
          </div>
        </div>`;

        document.getElementById('current-page').disabled = false;
      });

      const currentPageSelect = document.getElementById('current-page');
      currentPageSelect.addEventListener('keyup', () => {
        let computePer = Math.floor((parseInt(currentPageSelect.value, 10) / parseInt(selectedRead[0].num, 10)) * 100);
        computePer = Number.isNaN(computePer) ? 0 : computePer;
        if (currentPageSelect.value > parseInt(selectedRead[0].num, 10)) {
          document.querySelector('.exceed-page-msg').innerHTML = '<small class="text-danger">You have exceeded book total page</small>';
        } else {
          document.getElementById('progress-bar-book').style.width = `${computePer}%`;
          document.getElementById('progress-percentage-info').innerText = `${computePer}%`;
          document.querySelector('.exceed-page-msg').innerHTML = '';
        }
      });

      const saveCurrentRead = document.getElementById('save-current-read');
      firebase.auth().onAuthStateChanged((user) => {
        if (user !== null) {
          firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
            snap.forEach((snapShot) => {
              saveCurrentRead.addEventListener('click', () => {
                if (currentReadSelect.value !== '' && currentPageSelect.value !== '') {
                  const userRef = dbRef.child(`users/${user.uid}/${snapShot.key}`);

                  userRef.update({
                    currentRead: {
                      book_id: selectedRead[0].uid,
                      book_page: currentPageSelect.value,
                    },
                  }, () => {
                    const ui = new UI();
                    ui.displayMessage('Your current read has been updated succesfully!');
                  });
                }
              });
            });
          });
        }
      });

    });
  };

  this.displayCurrentRead = () => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user !== null) {
        firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const helper = new HelperMethod();
            const bookId = snapShot.val().currentRead.book_id;
            const bookPage = snapShot.val().currentRead.book_page;
            if (bookId !== '0') {
              firebase.database().ref(`addbook/${bookId}`).once('value', (snap) => {
                const currentRead = snap.val();
                document.getElementById('set-current-read').innerHTML = `
              <div class="row no-gutters">
                <div class="col-10">
                  <h2>${helper.stringLength(currentRead.title, 20)}</h2>
                  <small>By ${currentRead.author}</small>
                </div>
                <div class="col-2">
                  <div class="current-read-image">
                    <img src="${currentRead.book_image}" alt="${currentRead.title}">
                  </div>
                </div>
              </div>`;

                let computePer = Math.floor((parseInt(bookPage, 10) / parseInt(currentRead.num, 10)) * 100);
                computePer = Number.isNaN(computePer) ? 0 : computePer;
                document.getElementById('progress-bar-book').style.width = `${computePer}%`;
                document.getElementById('progress-percentage-info').innerText = `${computePer}%`;
              });
            } else {
              document.getElementById('set-current-read').innerHTML = `
            <div class="row no-gutters">
              <h4 class="text-center text-white w-100 mb-1">No Book Chosen!</h4>
            </div>`;
            }
          });
        });
      }
    });
  };
}

function HelperMethod() {
  this.getDate = () => {
    const today = new Date();
    const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    const dateTime = `${date} ${time}`;
    return dateTime;
  };

  this.stringLength = (string, count) => (string.length > count ? `${string.slice(0, count)}...` : string);
}


function UI() {
  this.displayMessage = (msg) => {
    document.getElementById('message-content').innerHTML = ` 
    <div class="alert alert-success alert-dismissible font-weight-bold fade show" role="alert">
      ${msg}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>`;
  };

  this.hideDisplayContent = (id1, id2) => {
    document.getElementById(id1).style.display = 'block';
    document.getElementById(id2).style.display = 'none';
  };

  this.showAuthForm = () => {
    const signInBtn = document.querySelector('#link-to-sign-in');
    const signUpBtn = document.querySelector('#link-to-sign-up');
    signInBtn.addEventListener('click', () => {
      this.hideDisplayContent('login-in-form', 'sign-up-form');
    });
    signUpBtn.addEventListener('click', () => {
      this.hideDisplayContent('sign-up-form', 'login-in-form');
    });
  };

  this.displayViewContent = (arrLinks, clickedLink) => {
    const pushedArray = [];
    const allPageLinks = Array.from(document.querySelectorAll(arrLinks));

    for (let i = 0; i < allPageLinks.length; i += 1) {
      if (allPageLinks[i].hasAttribute('data-target')) {
        const link = allPageLinks[i].getAttribute('data-target');
        pushedArray.push(link);
      };
    }
    pushedArray.splice(pushedArray.indexOf(clickedLink), 1);
    pushedArray.forEach((linkitem) => {
      const filteritem = linkitem == null ? 'top-books' : linkitem;
      this.hideDisplayContent(clickedLink, filteritem);
    });
  };

  this.formErrorMsg = (ele, msg, className) => {
    ele.innerHTML = msg;
    setTimeout(() => {
      document.getElementById(className).remove();
    }, 3000);
  };

  this.populateReview = (pushedReview) => {

    const reviewedBook = pushedReview.filter((item) => item.review_id === window.localStorage.getItem('review_id'));

    if (reviewedBook.length > 0) {
      let concatContent = '';
      reviewedBook.forEach((item) => {
        firebase.database().ref(`users/${item.reviewer_id}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            const userInfo = snapShot.val();
            let rateStar = '';
            for (let i = 1; i <= 5; i += 1) {
              if (i <= item.review_star) {
                rateStar += '<span class="fa fa-star star check"></span>';
              } else {
                rateStar += '<span class="fa fa-star star uncheck"></span>';
              }
            }

            concatContent += `
            <div class= "reviewed-comment list-group-item text-dark">
              <div class="d-flex">
                <div class="user-profile">
                  <img class="rounded-circle" src="${userInfo.photoURL}" alt="${userInfo.username.toLowerCase()}">
                </div>
                <div class="review-info">
                  <strong><em>@${userInfo.username.toLowerCase()}</em></strong>
                  <div class="stars">
                    ${rateStar}
                  </div>
                  <h6>${item.review_title}</h6>
                  <p>${item.review_comment}</p>
                </div>
              </div>
            </div>`;
          });
          document.querySelector('#review-container').innerHTML = concatContent;
        })
      })

    } else {
      document.querySelector('#review-container').innerHTML = '<h6 class="text-center mt-3">No reviews</h6>';
    }
  };

  this.addReviewToStore = () => {
    const addReview = document.getElementById('add-review-btn');

    addReview.addEventListener('click', (e) => {
      const review = {};
      const reviewComment = document.querySelector('#review-comment').value;
      const reviewTitle = document.querySelector('#review-title').value;
      const reviewId = document.querySelector('#review-id').value;
      const reviewStar = document.querySelectorAll('.star-icon.checked').length;
      firebase.auth().onAuthStateChanged((user) => {
        const reviewerId = user.uid;

        review.review_comment = reviewComment;
        review.review_title = reviewTitle;
        review.review_id = reviewId;
        review.review_star = reviewStar.toString();
        review.reviewer_id = reviewerId;

        const reviewRef = dbRef.child('addreview');
        const bookRef = dbRef.child(`addbook/${reviewId}`);

        if (reviewComment !== '' && reviewTitle !== '') {
          reviewRef.push(review, () => {
            firebase.database().ref(`addbook/${reviewId}`).once('value', (snap) => {
              let votesNum = snap.val().votes;
              const reviewerIdArray = snap.val().reviewers.split(',');
              const userInfo = firebase.auth().currentUser;
              if (userInfo != null) {
                votesNum += reviewStar;
                reviewerIdArray.push(userInfo.uid);
                bookRef.update({
                  votes: votesNum,
                  reviewers: reviewerIdArray.join(','),
                });
              }
            });
            firebase.database().ref('addreview').once('value', (snap) => {
              const pushedReview = [];
              snap.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                pushedReview.push(childData);
                document.querySelector('.review-content #review-comment').value = '';
                document.querySelector('.review-content #review-title').value = '';
                document.querySelectorAll('.star-icon.checked').forEach((item) => {
                  if (item.id !== 'rate-1') {
                    item.classList.remove('checked');
                  }
                });
              });
              const ui = new UI();
              ui.populateReview(pushedReview);
            });
          });
        }
      });
      e.preventDefault();
    });

    firebase.database().ref('addreview').once('value', (snap) => {
      const pushedReview = [];
      snap.forEach((childSnapshot) => {
        const childData = childSnapshot.val();
        pushedReview.push(childData);
      });
      const ui = new UI();
      ui.populateReview(pushedReview);
    });
  };

  this.rateBook = () => {
    function checkUncheckRateStars(rateId, className) {
      for (let i = 1; i <= 5; i += 1) {
        if (i <= rateId) {
          document.querySelector(`#rate-${i}`).classList.add(className);

        } else {
          document.querySelector(`#rate-${i}`).classList.remove(className);
        }
      }
    }

    document.querySelectorAll('.star-icon').forEach((item) => {
      const { id } = item;
      document.querySelector(`#${id}`).addEventListener('mouseenter', () => {
        const rateId = document.querySelector(`#${id}`).getAttribute('rate-id');
        checkUncheckRateStars(rateId, 'checked-hovered');
      });

      document.querySelector(`#${id}`).addEventListener('click', () => {
        const rateId = document.querySelector(`#${id}`).getAttribute('rate-id');
        checkUncheckRateStars(rateId, 'checked');
      });

      document.querySelector(`#${id}`).addEventListener('mouseleave', () => {
        for (let i = 2; i <= 5; i += 1) {
          document.querySelector(`#rate-${i}`).classList.remove('checked-hovered');
        }
      });
    });
  };

  this.toggleReadBtn = () => {
    const user = firebase.auth().currentUser;
    let readReads;
    if (user !== null) {
      firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
        snap.forEach((snapShot) => {
          const childData = snapShot.val();
          const { key } = snapShot;

          readReads = childData.readBooks;
          const readBookSplited = readReads.split(',');

          document.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-icon')) {
              const { id } = e.target;
              const readId = e.target.getAttribute('data-read');
              const readItem = document.getElementById(id);
              const checkIcon = '<i class="fas fa-check"></i>';

              if (readItem.classList.contains('cover-unhover')) {
                document.getElementById(id).classList.add('cover-hover');
                document.getElementById(id).classList.remove('cover-unhover');
                document.getElementById(id).innerHTML = `Read ${checkIcon}`;
                readBookSplited.push(readId);
              } else if (readItem.classList.contains('cover-hover')) {
                document.getElementById(id).classList.add('cover-unhover');
                document.getElementById(id).classList.remove('cover-unhover');
                document.getElementById(id).innerHTML = 'Unread';
                readBookSplited.splice(readBookSplited.indexOf(readId), 1);
              }

              readReads = readBookSplited.join(',');

              const userReff = dbRef.child(`users/${user.uid}/${key}`);
              userReff.update(
                { readBooks: readReads },
              );
            }
          });
        });
      });
    } else {
      readReads = '';
    }
  };

  this.toggleReadCheckBox = (readCheckBox, readText) => {
    const read = document.getElementById(readCheckBox);
    const readContent = document.getElementById(readText);
    read.addEventListener('change', () => {
      if (read.checked) {
        readContent.innerText = 'Read';
        readContent.classList.add('read-status');
        readContent.classList.remove('unread-status');
      } else {
        readContent.innerText = 'Unread';
        readContent.classList.remove('read-status');
        readContent.classList.add('unread-status');
      }
    });
  };

  this.toggleEditReadCheckBox = () => {
    const read = document.getElementById('edit-read');
    const readText = document.getElementById('edit-read-text');
    if (read.checked) {
      readText.innerText = 'Read';
      readText.classList.add('read-status');
      readText.classList.remove('unread-status');
    } else {
      readText.innerText = 'Unread';
      readText.classList.remove('read-status');
      readText.classList.add('unread-status');
    }
  };

  this.filterBooksByGenre = () => {
    const filterButtons = document.querySelector('.filters-button-group');
    const sortButtons = document.querySelector('.sort-button-group');
    const allFilterButtons = document.querySelectorAll('.filters-button-group .list-group-item');

    filterButtons.addEventListener('click', (e) => {
      if (e.target.classList.contains('list-group-item')) {
        const { id } = e.target;
        Array.from(allFilterButtons).forEach((item) => {
          if (item.id === id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
        const allBooks = document.querySelectorAll('.all-books .content .item');
        Array.from(allBooks).forEach((item) => {
          if (item.classList.contains(id)) {
            item.classList.remove('hide');
            setTimeout(() => {
              item.style.display = 'block';
            }, 650);
          } else {
            item.classList.add('hide');
            setTimeout(() => {
              item.style.display = 'none';
            }, 650);
          }
        });
      }
    });

    sortButtons.addEventListener('change', () => {
      const { value } = sortButtons;
      function sortedBook(a, b) {
        if (a[value] > b[value]) { return -1; }
        if (a[value] < b[value]) { return 1; }
        return 0;
      }
      const book = new Book();
      book.addAllBooksToDOM(sortedBook);
    });
  };

  this.slideshow = () => {
    const slideshowContent = document.querySelectorAll('.slide-content .items');
    let list = [0, 1, 2, 3];
    const slideshow = document.querySelectorAll('.slide .slidebtn');
    Array.from(slideshow).forEach((ele) => {
      ele.addEventListener('click', () => {
        let dataSlide = ele.getAttribute('data-slide');
        const slideEffect = dataSlide === '1' ? 'slide-effect-right' : 'slide-effect-left';
        dataSlide = parseInt(dataSlide, 10);
        const getItemIndex = list.map((item) => {
          let numToAdd;
          if ((item + dataSlide) >= list.length) {
            numToAdd = 0 - item;
          } else if ((item + dataSlide) < 0) {
            numToAdd = list.length + (item + dataSlide);
          } else {
            numToAdd = dataSlide;
          }
          return item + numToAdd;
        });

        const displayItem = getItemIndex.slice(0, 2);
        let appendItem = `<div class="slideshow d-flex ${slideEffect}">`;
        for (let i = 0; i < displayItem.length; i += 1) {
          for (let j = 0; j < slideshowContent.length; j += 1) {
            if (displayItem[i] === j) {
              appendItem += `<div class="items items-${j}" style="display: block">
              ${slideshowContent[j].innerHTML}
              </div>`;
            }
          }
        }
        appendItem += '</div>';
        document.querySelector('.slide-content').innerHTML = appendItem;

        list = getItemIndex;
      });
    });
  };

  this.updateUser = () => {
    const userEmail = document.querySelector('.my-profile #profile-username');
    const userPhoto = document.getElementById('display-prof-img');
    const updateProfBtn = document.getElementById('update-profile-btn');

    firebase.auth().onAuthStateChanged((user) => {
      if (user !== null) {
        firebase.database().ref(`users/${user.uid}`).once('value', (snap) => {
          snap.forEach((snapShot) => {
            userEmail.value = snapShot.val().username;
            userPhoto.innerHTML = `<img src="${snapShot.val().photoURL}">`;
            updateProfBtn.addEventListener('click', () => {
              const profUsername = document.querySelector('#profile-username').value;
              const profImage = document.querySelector('#profile-image').files[0];

              const userRef = dbRef.child(`users/${user.uid}/${snapShot.key}`);

              if (profImage !== undefined) {
                const storageRef = firebase.storage().ref().child(`${user.uid}/${profImage.name}`);
                const uploadTask = storageRef.put(profImage);

                uploadTask.on('state_changed', () => {
                }, () => {
                }, () => {
                  uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    userRef.update({
                      photoURL: downloadURL,
                      username: profUsername,
                    }, () => {
                      location.reload();
                    });
                  });
                });
              } else {
                userRef.update({
                  username: profUsername
                }, () => {
                  location.reload();
                });
              }
              this.displayMessage('Your profile has been updated succesfully!')
            });
          });
        });
      }
    });
  };

  this.updateLibrarianOfWeek = () => {
    firebase.database().ref('addbook').once('value', (snap) => {
      const getAllAddedBy = {};
      snap.forEach((snapShot) => {
        const addedBy = snapShot.val().added_by;
        if (addedBy in getAllAddedBy) {
          getAllAddedBy[addedBy] += 1;
        } else {
          getAllAddedBy[addedBy] = 1;
        }
      });
      const sortAddedBy = Object.keys(getAllAddedBy).sort((a, b) => getAllAddedBy[b] - getAllAddedBy[a]);

      const libbOfWeek = sortAddedBy[0];

      firebase.database().ref(`users/${libbOfWeek}`).once('value', (snapLibb) => {
        snapLibb.forEach((snapShot) => {
          document.getElementById('libb-of-week-user').innerText = `${snapShot.val().username}`;
        });
      });
    });

  };

}

// LocalStorage Constructor
function LocalStorage() {
  this.getPage = () => {
    if (window.localStorage.getItem('page_link') === null) {
      window.localStorage.setItem('page_link', 'top-books');
    }
    const page = window.localStorage.getItem('page_link');

    const ui = new UI();
    ui.displayViewContent('#app-links .get-link', page);
    if (page === 'discover' || page === 'now-reading') {
      // document.getElementById('last-column').style.display = 'block';
      // document.getElementById('navbar-light').style.maxWidth = '58.3%';
      // document.getElementById('navbar-light').style.flex = '0 0 58.3%';
    } else {
      // document.getElementById('last-column').style.display = 'none';
      // document.getElementById('navbar-light').style.maxWidth = '83.3%';
      // document.getElementById('navbar-light').style.flex = '0 0 83.3%';
    }
  };

  this.setReviewId = (reviewId) => {
    if (window.localStorage.getItem('review_id') === null) {
      window.localStorage.setItem('review_id', 'no-reviews');
    } else {
      window.localStorage.setItem('review_id', reviewId);
    }
    const reviewID = window.localStorage.getItem('review_id');
    return reviewID;
  };

  this.setPage = () => {
    const clickedPage = document.querySelectorAll('#app-links .get-link');
    Array.from(clickedPage).forEach((item) => {
      item.addEventListener('click', () => {
        const pageTarget = item.getAttribute('data-target');
        window.localStorage.setItem('page_link', `${pageTarget}`);
        const ui = new UI();
        ui.displayViewContent('#app-links .get-link', pageTarget);
        if (pageTarget === 'discover' || pageTarget === 'now-reading') {
        } else {
        }
      });
    });
    // clickedPage.addEventListener('click', (e) => {
    //   if (e.target.classList.contains('get-link')) {
    //     const pageTarget = e.target.getAttribute('data-target');
    //     window.localStorage.setItem('page_link', `${pageTarget}`);
    //     const ui = new UI();
    //     ui.displayViewContent('#app-links .get-link', pageTarget);
    //     if (pageTarget === 'discover' || pageTarget === 'now-reading') {
    //     } else {
    //     }
    //   }
    // });
  };

  this.changePage = (page) => {
    window.localStorage.setItem('page_link', page);
    const ui = new UI();
    ui.displayViewContent('.app-links .get-link', page);
  };
}



document.getElementById('toggle-review-button').addEventListener('click', () => {
  if (document.getElementById('last-column').classList.contains('close-review')) {
    document.getElementById('toggle-review-button').innerHTML = '<i class="fas fa-times fa-2"></i>';
    document.getElementById('last-column').classList.remove('close-review');
  } else {
    document.getElementById('toggle-review-button').innerHTML = '<i class="fas fa-bars fa-2"></i>';
    document.getElementById('last-column').classList.add('close-review');
  }
});

// bookListsRef.on("child_added", snap => {
//   let book_snapped = snap.val();
//   console.log(book_snapped)
// })


function sortBook(a, b) {
  // return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  if (new Date(b.created_at).getTime() < new Date(a.created_at).getTime()) { return -1; }
  if (new Date(a.created_at).getTime() > new Date(b.created_at).getTime()) { return 1; }
  return 0;
}
const auth = new Auth();
auth.signUp();
auth.signOut();
auth.signIn();
auth.userIsSignedIn();

const localStorage = new LocalStorage();
localStorage.getPage();
localStorage.setPage('app-links');

const ui = new UI();
ui.addReviewToStore();
ui.rateBook();
ui.showAuthForm();
ui.filterBooksByGenre();
ui.updateUser();
ui.updateLibrarianOfWeek();

const book = new Book();
book.addBookToStore();
book.editBookList();
book.addAllBooksToDOM(sortBook);
book.checkFavouriteBooks();
book.saveCurrentReadToStore();
book.displayCurrentRead();


$('#book-image').on('change', (event) => {
  const { files } = event.target;
  const image = files[0];
  console.log(image.size);
  const reader = new FileReader();
  reader.onload = function (file) {
    const img = new Image();
    img.src = file.target.result;

    $('#display-img').html(img);

    $('#drop_zone').css({
      opacity: '0',
      border: 'none',
    });
  };
  reader.readAsDataURL(image);
  console.log(files);
});


$('#edit-book-image').on('change', (event) => {
  const { files } = event.target;
  const image = files[0];
  console.log(image.size);
  const reader = new FileReader();
  reader.onload = function (file) {
    const img = new Image();
    $(img).addClass('edit-book-cover');
    img.src = file.target.result;

    $('#edit-display-img').html(img);

    $('#drop_zone').css({
      opacity: '0',
      border: 'none',
    });
  };
  reader.readAsDataURL(image);
  console.log(files);
});


$('#profile-image').on('change', (event) => {
  const { files } = event.target;
  const image = files[0];

  const reader = new FileReader();
  reader.onload = function (file) {
    const img = new Image();
    $(img).addClass('profile-image');
    img.src = file.target.result;

    $('#display-prof-img').html(img);

    // $('#drop_zone').css({
    //   opacity: '0',
    //   border: 'none',
    // });
  };
  reader.readAsDataURL(image);
});


