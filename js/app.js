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
        const [email, username, photo, favouriteBooks, bookmarkBooks] = [emailAdd.value, emailAdd.value.split('@')[0], 'https://cdn.wpbeginner.com/wp-content/uploads/2012/08/gravatarlogo.jpg', '0', '0'];
        const userInfo = {
          email, username, photo, favouriteBooks, bookmarkBooks,
        };
        const users = dbRef.child('users');
        users.push(userInfo);

        document.getElementById('sign-up-form-content').reset();
      }).catch((error) => {
        document.getElementById('signup-error-msg').innerText = error.message;
      });
    }
    const signUpButton = document.getElementById('sign-up-btn');
    signUpButton.addEventListener('click', signUserUp);
  };

  this.signOut = () => {
    function signUserOut() {
      firebase.auth().signOut();
    }
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', signUserOut);
  };

  this.signIn = () => {
    function signUserIn() {
      const [loginEmail, loginPassword] = [document.getElementById('login-email'), document.getElementById('login-password')];

      firebase.auth().signInWithEmailAndPassword(loginEmail.value, loginPassword.value).then(() => {
        document.getElementById('sign-in-form-content').reset();
      })
        .catch((error) => {
          document.getElementById('login-error-msg').innerText = error.message;
        });
    }

    const signInButton = document.getElementById('log-in-btn');
    signInButton.addEventListener('click', signUserIn);
  };

  this.userIsSignedIn = () => {
    const ui = new UI();
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        firebase.database().ref('users').once('value', (snapshot) => {
          const userProfile = [];
          snapshot.forEach((childSnapshot) => {
            const childData = childSnapshot.val();
            if (childData.email === user.email) {
              userProfile.push(childData);
            }
          });
          document.querySelector('.user-profile').innerHTML = `
            <img src="${userProfile[0].photo}" alt="Profile Image">
            <span class="username ml-3">${userProfile[0].username.toUpperCase()}</span>`;
        });
        ui.hideDisplayContent('app-container', 'login-form');
      } else {
        ui.hideDisplayContent('login-form', 'app-container');
      }
    });
  };
}


// Book Constructor
function Book() {
  this.addBookToStore = () => {
    const addBookList = document.getElementById('addBookListBtn');
    addBookList.addEventListener('click', (e) => {
      const addBookListForm = document.querySelectorAll('#addBookListForm .form-control');

      const addedBookValue = {};
      Array.from(addBookListForm).forEach((textField) => {
        const key = textField.getAttribute('data-key');
        let value = '';
        if (key === 'read') {
          value = textField.checked;
        } else if (key === 'book_image') {
          value = '';
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
          document.querySelector('.upload-percent').innerText = `${parseInt(progress)}%...`;
        }, (error) => {
          // eslint-disable-next-line no-console
          console.log(error.message);
        }, () => {
          uploadImage.snapshot.ref.getDownloadURL().then((downloadURL) => {
            const helpers = new HelperMethod();
            addedBookValue.book_image = downloadURL;
            addedBookValue.created_at = helpers.getDate();
            addedBookValue.id = document.querySelectorAll('.all-books .content .item').length;

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

      console.log(editedBookValue);
      e.preventDefault();
    });
  };

  this.getAllBooksFromStore = (snapshot) => {
    let arr = [];
    snapshot.forEach((childSnapshot) => {
      const childKey = childSnapshot.key;
      const childData = childSnapshot.val();
      const data = childData;
      data.uid = childKey;
      arr.push(data);
    });
    arr = arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return arr;
  };

  this.addAllBooksToDOM = () => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const addBookToContent = document.querySelector('.all-books .content');

      const book = new Book();
      const pushArr = book.getAllBooksFromStore(snapshot);

      const userId = firebase.auth().currentUser;
      firebase.database().ref('users').once('value', (snap) => {
        let favouriteReads; let bookmarkReads;
        snap.forEach((childSnapshot) => {
          const childData = childSnapshot.val();
          if (userId !== null) {
            if (childData.email === userId.email) {
              favouriteReads = childData.favouriteBooks;
              bookmarkReads = childData.bookmarkBooks;
            }
          }
        });

        pushArr.forEach((item) => {
          const node = document.createElement('div');
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
          node.classList = 'item text-center';
          node.innerHTML = `
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
                  <h5>${item.title}</h5>
                  <p>By ${item.author}</p>
                </div>`;

          addBookToContent.appendChild(node);
        });
      });
    });
  };

  this.addBookmarkToDom = (pageToAdd, storedBook) => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const book = new Book();
      const pushArr = book.getAllBooksFromStore(snapshot);

      const mappedStoredBook = storedBook.split(',');
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

      book.showReadBookModal(pushArr);
      book.showReviewWhenClicked(pushArr);
    });
  };

  this.checkFavouriteBooks = () => {
    firebase.database().ref('addbook').once('value', () => {
      const user = firebase.auth().currentUser;
      firebase.database().ref('users').once('value', (snap) => {
        let favouriteReads; let bookmarkReads;
        let key;
        snap.forEach((childSnapshot) => {
          const childData = childSnapshot.val();
          key = childSnapshot.key;
          if (user !== null) {
            if (childData.email === user.email) {
              favouriteReads = childData.favouriteBooks;
              bookmarkReads = childData.bookmarkBooks;
            }
          }
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

              const userReff = dbRef.child(`users/${key}`);
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

              const userReff = dbRef.child(`users/${key}`);
              userReff.update(
                { bookmarkBooks: bookmarkReads },
              );
              book.addBookmarkToDom('#bookmarked-books', bookmarkReads);
            }
          });
        });
      });
    });
  };

  this.managedBooks = () => {
    firebase.database().ref('addbook').once('value', (snapshot) => {
      const addManagedBookToContent = document.querySelector('#managed-books .content');
      const book = new Book();
      const pushArr = book.getAllBooksFromStore(snapshot);

      pushArr.forEach((item) => {
        const node = document.createElement('div');
        const readStatus = item.read ? 'cover cover-hover' : 'cover cover-unhover';
        const checkIcon = item.read ? '<i class="fas fa-check"></i>' : '';
        node.classList = 'managed-content text-center';
        node.innerHTML = `
            <div class="position-relative">
              <img class="img-fluid cover-img"
                src="${item.book_image}"
                alt="book-cover" />
                <div class="hovered-content">
                <div class="${readStatus} read-icon" id="read-book-${item.id}" data-read="${item.uid}"> ${item.read ? 'Read' : 'Unread'} ${checkIcon}</div>
              </div>
            </div>
            <div class="managed-icons">
              <i class="fas fa-edit color-primary edit-icon" data-toggle="modal" data-target="#editBookModalLong" data-id="${item.uid}"></i>
              <i class="fas fa-times-circle text-danger delete-icon" data-delete="${item.uid}" id="delete-book-${item.id}"></i>
            </div>
            <h5>${item.title}</h5>`;

        addManagedBookToContent.appendChild(node);
      });

      const ui = new UI();
      ui.toggleReadBtn();
      book.showEditBookModal();
      book.deleteBook();
    });
  };

  this.showReadBookModal = (pushArr) => {
    document.querySelectorAll('.read-button').forEach((item) => {
      const { id } = item;
      document.querySelector(`#${id}`).addEventListener('click', () => {
        const dataId = document.querySelector(`#${id}`).getAttribute('data-id');
        const filteredData = pushArr.filter((itemfil) => itemfil.uid === dataId);

        const ref = firebase.database().ref('addreview');
        ref.orderByChild('review_id').equalTo(dataId).on('value', (snapshot) => {
          let reviewCount;
          if (snapshot.val() == null) {
            reviewCount = '0 vote';
          } else {
            const count = Object.values(snapshot.val()).map((itemEle) => itemEle.review_star).reduce((acc, ele) => parseInt(acc, 10) + parseInt(ele, 10));
            reviewCount = count === 1 ? '1 vote' : `${count} votes`;
          }
          const helpers = new HelperMethod();
          const modalContent = document.querySelector('.modal .modal-body .content');
          modalContent.innerHTML = `
              <div class="row no-gutters m-0">
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
                  <div class="d-flex justify-content-around">
                    <p>
                      <span class="fas fa-star modal-star-checked"></span>
                      <span>${reviewCount}</span>
                    </p>
                    <p>${filteredData[0].num} pages</p>
                  </div>
                  <div class="mb-4">
                    <a href="${filteredData[0].booklink}" class="button">Read the book</a>
                  </div>

                  <p>${helpers.stringLength(filteredData[0].description, 300)}</p>
                </div>
              </div>
              </div>`;
        });
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
            } else if (editBookListForm[i].getAttribute('data-key') === 'book_image') {
              const bookImage = editBookListForm[i].getAttribute('data-key');
              document.querySelector('#edit-display-img').innerHTML = `<img src="${snap.val()[bookImage]}" class="edit-book-cover">`;
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


// UI Constructor
function UI() {
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
      if (allPageLinks[i].className === 'list-item-link get-link') {
        const link = allPageLinks[i].getAttribute('data-target');
        pushedArray.push(link);
      }
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
    // reviewedBook = reviewedBook === undefined ? [] : reviewedBook[0];
    if (reviewedBook.length > 0) {
      let concatContent = '';
      reviewedBook.forEach((item) => {
        let rateStar = '';
        for (let i = 1; i <= 5; i += 1) {
          if (i <= item.review_star) {
            rateStar += '<span class="fa fa-star star check"></span>';
          } else {
            rateStar += '<span class="fa fa-star star uncheck"></span>';
          }
        }

        concatContent += `
        <div class="reviewed-comment list-group-item text-dark">
          <div class="stars">
          ${rateStar}
          </div>
          <div>
            <h6>${item.review_title}</h6>
            <p>${item.review_comment}</p>
          </div>
          </div>`;
      });
      document.querySelector('#review-container').innerHTML = concatContent;
    } else {
      document.querySelector('#review-container').innerHTML = '<h6 class="text-center mt-3">No reviews</h6>';
    }
  };

  this.addReviewToStore = () => {
    const addReview = document.getElementById('add-review-btn');
    addReview.addEventListener('click', (e) => {
      const reviewComment = document.querySelector('#review-comment').value;
      const reviewTitle = document.querySelector('#review-title').value;
      const reviewId = document.querySelector('#review-id').value;
      const reviewStar = document.querySelectorAll('.star-icon.checked').length;
      const review = {};
      review.reviewComment = reviewComment;
      review.reviewTitle = reviewTitle;
      review.reviewId = reviewId;
      review.review_star = reviewStar.toString();
      const reviewRef = dbRef.child('addreview');

      if (reviewComment !== '' && reviewTitle !== '') {
        reviewRef.push(review, () => {
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
    document.querySelectorAll('.star-icon').forEach((item) => {
      const { id } = item;
      document.querySelector(`#${id}`).addEventListener('mouseover', () => {
        const rateId = document.querySelector(`#${id}`).getAttribute('rate-id');
        for (let i = 1; i <= 5; i += 1) {
          if (i <= rateId) {
            document.querySelector(`#rate-${i}`).classList.add('checked');
          } else {
            document.querySelector(`#rate-${i}`).classList.remove('checked');
          }
        }
      });
    });
  };

  this.toggleReadBtn = () => {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('read-icon')) {
        const { id } = e.target;
        const readContent = document.getElementById(id).innerText;
        const checkIcon = '<i class="fas fa-check"></i>';
        const changedText = readContent === 'Read' ? ['Unread', false, 'cover-unhover'] : [`Read ${checkIcon}`, true, 'cover-hover'];

        document.getElementById(id).className = `read-icon cover ${changedText[2]}`;
        document.getElementById(id).innerHTML = `${changedText[0]}`;
        const userID = document.getElementById(id).getAttribute('data-read');
        const userRef = dbRef.child(`addbook/${userID}`);
        userRef.update({
          read: changedText[1],
        });
      }
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

  this.setPage = (clickedArea) => {
    const clickedPage = document.getElementById(clickedArea);
    clickedPage.addEventListener('click', (e) => {
      if (e.target.className === 'list-item-link get-link') {
        const pageTarget = e.target.getAttribute('data-target');
        window.localStorage.setItem('page_link', `${pageTarget}`);
        const ui = new UI();
        ui.displayViewContent('#app-links .get-link', pageTarget);

        if (pageTarget === 'discover' || pageTarget === 'now-reading') {
          // document.getElementById('last-column').style.display = 'block';
          // document.getElementById('navbar-light').style.maxWidth = '58.3%';
          // document.getElementById('navbar-light').style.flex = '0 0 58.3%';
        } else {
          // document.getElementById('last-column').style.display = 'none';
          // document.getElementById('navbar-light').style.maxWidth = '83.3%';
          // document.getElementById('navbar-light').style.flex = '0 0 83.3%';
        }
      }
    });
  };

  this.changePage = (page) => {
    window.localStorage.setItem('page_link', page);
    const ui = new UI();
    ui.displayViewContent('#app-links .get-link', page);
  };
}


if (window.localStorage.getItem('page_link') !== 'add-a-book') {
  firebase.database().ref('addbook').once('value', (snapshot) => {
    const addBookToContent = document.querySelector('.all-books .content');
    const addManagedBookToContent = document.querySelector('#managed-books .content');


    // let pushArr;
    let pushArr = [];
    snapshot.forEach((childSnapshot) => {
      const childKey = childSnapshot.key;
      const childData = childSnapshot.val();
      const data = childData;
      data.uid = childKey;
      pushArr.push(data);
    });

    const book = new Book();
    book.allBooks = pushArr;

    pushArr = pushArr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


    let book_titles = '<option value="" disabled selected>Current Read</option>';
    pushArr.forEach((item) => {
      book_titles += `<option value="${item.id}">${item.title}</option>`;
    });
    document.querySelector('#current-read').innerHTML = book_titles;

    let selected_read;
    const current_read_select = document.getElementById('current-read');
    current_read_select.addEventListener('change', function () {
      const options = this.options[this.selectedIndex].value;
      selected_read = pushArr.filter((item) => item.id == options);

      document.querySelector('#currently-reading-title').innerText = `${selected_read[0].title}`;
      document.querySelector('#currently-reading-author').innerText = `${selected_read[0].author}`;
      document.getElementById('current-read-image').innerHTML = `<img src="${selected_read[0].book_image}" alt="${selected_read[0].title}">`;


      document.getElementById('current-page').disabled = false;
    });

    if (current_read_select.value == '') {
      document.getElementById('current-page').disabled = true;
    }


    const current_page_select = document.getElementById('current-page');
    current_page_select.addEventListener('keyup', function () {
      const computePer = parseInt((this.value / parseInt(selected_read[0].num)) * 100);
      if (this.value > parseInt(selected_read[0].num)) {
        document.querySelector('.exceed-page-msg').innerHTML = '<small class="text-danger">You have exceeded book total page</small>';
      } else {
        document.getElementById('progress-bar-book').style.width = `${computePer}%`;
        document.getElementById('progress-percentage-info').innerText = `${computePer}%`;
        document.querySelector('.exceed-page-msg').innerHTML = '';
      }
    });

  });
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

const book = new Book();
book.addBookToStore();
book.editBookList();
book.addAllBooksToDOM();
book.checkFavouriteBooks();
book.managedBooks();



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


$(document).ready(() => {
  $('.owl-carousel').owlCarousel({
    navText: ['<i class="fas fa-chevron-left text-white"></i>', '<i class="fas fa-chevron-right text-white"></i>'],
    loop: true,
    margin: 10,
    nav: true,
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 2,
      },
      900: {
        items: 3,
      },
      1000: {
        items: 2,
      },
    },
  });
});
