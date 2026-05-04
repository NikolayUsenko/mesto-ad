/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addCard, changeLikeCardStatus, deleteCardFromServer } from "./components/api.js";
import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow?.querySelector(".popup__form");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalUserList = cardInfoModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document.getElementById("popup-info-definition-template");
const userPreviewTemplate = document.getElementById("popup-info-user-preview-template");

let currentUserId = null;
let cardToDeleteId = null;
let cardToDeleteElement = null;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const createInfoItem = (term, description) => {
  const itemElement = infoDefinitionTemplate.content.cloneNode(true);
  itemElement.querySelector(".popup__info-term").textContent = term;
  itemElement.querySelector(".popup__info-description").textContent = description;
  return itemElement;
};

const createUserPreviewItem = (userName) => {
  const itemElement = userPreviewTemplate.content.cloneNode(true);
  itemElement.querySelector(".popup__list-item").textContent = userName;
  return itemElement;
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const setButtonLoading = (button, isLoading, defaultText, loadingText) => {
  if (isLoading) {
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = defaultText;
    button.disabled = false;
  }
};

const openRemoveCardModal = (cardId, cardElement) => {
  cardToDeleteId = cardId;
  cardToDeleteElement = cardElement;
  clearValidation(removeCardForm, validationSettings);
  openModalWindow(removeCardModalWindow);
};

const handleInfoClick = async (cardId) => {
  try {
    const cards = await getCardList();
    const card = cards.find((c) => c._id === cardId);

    if (!card) return;

    cardInfoModalInfoList.innerHTML = "";
    cardInfoModalUserList.innerHTML = "";

    cardInfoModalInfoList.append(
      createInfoItem("Описание:", card.name)
    );
    cardInfoModalInfoList.append(
      createInfoItem("Дата создания:", formatDate(card.createdAt))
    );
    cardInfoModalInfoList.append(
      createInfoItem("Владелец:", card.owner.name)
    );
    cardInfoModalInfoList.append(
      createInfoItem("Количество лайков:", card.likes.length.toString())
    );

    cardInfoModalText.textContent = "Лайкнули:";

    if (card.likes.length > 0) {
      card.likes.forEach((user) => {
        cardInfoModalUserList.append(createUserPreviewItem(user.name));
      });
    } else {
      cardInfoModalUserList.append(createUserPreviewItem("Нет лайков"));
    }

    openModalWindow(cardInfoModalWindow);
  } catch (err) {
    console.error("Ошибка при получении статистики карточки:", err);
  }
};

const handleProfileFormSubmit = async (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  const defaultText = submitButton.textContent;

  setButtonLoading(submitButton, true, defaultText, "Сохранение...");

  try {
    const userData = await setUserInfo({
      name: profileTitleInput.value,
      about: profileDescriptionInput.value,
    });
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    closeModalWindow(profileFormModalWindow);
  } catch (err) {
    console.error("Ошибка при обновлении профиля:", err);
  } finally {
    setButtonLoading(submitButton, false, defaultText, "Сохранение...");
  }
};

const handleAvatarFormSubmit = async (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  const defaultText = submitButton.textContent;

  setButtonLoading(submitButton, true, defaultText, "Сохранение...");

  try {
    const userData = await setUserAvatar(avatarInput.value);
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    closeModalWindow(avatarFormModalWindow);
    avatarForm.reset();
    clearValidation(avatarForm, validationSettings);
  } catch (err) {
    console.error("Ошибка при обновлении аватара:", err);
  } finally {
    setButtonLoading(submitButton, false, defaultText, "Сохранение...");
  }
};

const handleCardFormSubmit = async (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  const defaultText = submitButton.textContent;

  setButtonLoading(submitButton, true, defaultText, "Создание...");

  try {
    const newCard = await addCard({
      name: cardNameInput.value,
      link: cardLinkInput.value,
    });
    placesWrap.prepend(
      createCardElement(newCard, {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: (cardId, likeButton, likeCountElement, isLiked) =>
          likeCard(cardId, likeButton, likeCountElement, isLiked, changeLikeCardStatus),
        onDeleteCard: (cardId, cardElement) => {
          openRemoveCardModal(cardId, cardElement);
        },
        onInfoClick: handleInfoClick,
        currentUserId,
      })
    );
    closeModalWindow(cardFormModalWindow);
    cardForm.reset();
    clearValidation(cardForm, validationSettings);
  } catch (err) {
    console.error("Ошибка при добавлении карточки:", err);
  } finally {
    setButtonLoading(submitButton, false, defaultText, "Создание...");
  }
};

const handleRemoveCardSubmit = async (evt) => {
  evt.preventDefault();
  const submitButton = removeCardForm.querySelector(".popup__button");
  const defaultText = submitButton.textContent;

  setButtonLoading(submitButton, true, defaultText, "Удаление...");

  try {
    await deleteCard(cardToDeleteId, cardToDeleteElement, deleteCardFromServer);
    closeModalWindow(removeCardModalWindow);
    cardToDeleteId = null;
    cardToDeleteElement = null;
  } catch (err) {
    console.error("Ошибка при удалении карточки:", err);
  } finally {
    setButtonLoading(submitButton, false, defaultText, "Удаление...");
  }
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

if (removeCardForm) {
  removeCardForm.addEventListener("submit", handleRemoveCardSubmit);
}

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// загрузка данных с сервера
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(card, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: (cardId, likeButton, likeCountElement, isLiked) =>
            likeCard(cardId, likeButton, likeCountElement, isLiked, changeLikeCardStatus),
          onDeleteCard: (cardId, cardElement) => {
            openRemoveCardModal(cardId, cardElement);
          },
          onInfoClick: handleInfoClick,
          currentUserId,
        })
      );
    });
  })
  .catch((err) => {
    console.error("Ошибка при загрузке данных:", err);
  });

// настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});