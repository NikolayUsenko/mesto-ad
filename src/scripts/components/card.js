export const likeCard = async (cardId, likeButton, likeCountElement, isLiked, changeLikeStatus) => {
  try {
    const updatedCard = await changeLikeStatus(cardId, isLiked);
    likeButton.classList.toggle("card__like-button_is-active");
    likeCountElement.textContent = updatedCard.likes.length;
    return updatedCard;
  } catch (err) {
    console.error("Ошибка при изменении лайка:", err);
  }
};

export const deleteCard = async (cardId, cardElement, deleteFromServer) => {
  try {
    await deleteFromServer(cardId);
    cardElement.remove();
  } catch (err) {
    console.error("Ошибка при удалении карточки:", err);
  }
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard, onInfoClick, currentUserId }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  const isLiked = data.likes.some((user) => user._id === currentUserId);
  const isOwner = data.owner._id === currentUserId;

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  likeCountElement.textContent = data.likes.length;

  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  if (!isOwner) {
    deleteButton.remove();
  }

  if (onLikeIcon && isOwner !== undefined) {
    likeButton.addEventListener("click", () => {
      const isCurrentlyLiked = likeButton.classList.contains("card__like-button_is-active");
      onLikeIcon(data._id, likeButton, likeCountElement, isCurrentlyLiked);
    });
  }

  if (onDeleteCard && isOwner) {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(data._id, cardElement);
    });
  }

  if (onInfoClick) {
    infoButton.addEventListener("click", () => {
      onInfoClick(data._id);
    });
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({ name: data.name, link: data.link }));
  }

  return cardElement;
};