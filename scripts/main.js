const myImage = document.querySelector('img');
let myButton = document.querySelector('button');
let myHeading = document.querySelector('h1');

myImage.onclick = () => {
  const mySrc = myImage.getAttribute('src');

  if (mySrc === 'images/firefox-icon.png.webp') {
    myImage.setAttribute('src', 'images/firefox2.png');
  } else {
    myImage.setAttribute('src', 'images/firefox-icon.png.webp');
  }
};
function setUserName() {
  const myName = prompt('あなたの名前を入力してください');
  if (!myName) {
    setUserName();
  } else {
    localStorage.setItem('name', myName);
    myHeading.textContent = `Mozillaはかっこいいよ、${myName}さん。`;
  }
}

if (!localStorage.getItem('name')) {
  setUserName();
} else {
  const storedName = localStorage.getItem('name');
  myHeading.textContent = `Mozillaはかっこいいよ、${storedName}`;
}

myButton.onclick = () => {
  setUserName();
};
