const RESEND_DELAY = 60;
const VERIFICATION_CODE_LENGTH = 5;
const PHONE_REGEX = /^09\d{9}$/;
const baseURL = "http://localhost/SEProject/back/api.php";

const authState = {
  phone: null,
  verificationId: null,
  resendTimer: null,
  isVerifying: false,
  signupData: null
};

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();

  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("profile-completion-modal");
  const verifyModal = document.getElementById("verify-modal");
  const loginBtn = document.getElementById("login-btn");
  const nextBtn = document.getElementById("next-btn");
  const signUpNextBtn = document.getElementById("signup-next-btn")
  const phoneInput = document.getElementById("login-phone");
  const verifyForm = document.getElementById("verify-form");
  const closeButtons = document.querySelectorAll(".close-modal");

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const resendContainer = document.createElement("div");
  resendContainer.className = "resend-container";
  resendContainer.innerHTML = `
        <div class="resend-timer" style="display: none;">
            <span>ارسال مجدد کد در </span>
            <span class="timer-count">60</span>
            <span> ثانیه</span>
        </div>
        <button type="button" class="resend-btn auth-btn auth-btn-secondary" style="display: none;">
            ارسال مجدد کد
        </button>
    `;
  verifyForm.appendChild(resendContainer);

  const resendBtn = resendContainer.querySelector(".resend-btn");
  const timerElement = resendContainer.querySelector(".resend-timer");
  const timerCount = resendContainer.querySelector(".timer-count");

  function handleModalVisibility(modal, visible) {
    if (!modal) return;

    if (visible) {
      modal.style.display = "flex";
      setTimeout(() => modal.classList.add("show"), 10);
      document.body.style.overflow = "hidden";
    } else {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    }
  }

  function validatePhoneNumber(phone) {
    return PHONE_REGEX.test(phone);
  }

  function startResendTimer() {
    let timeLeft = RESEND_DELAY;
    timerElement.style.display = "block";
    resendBtn.style.display = "none";

    authState.resendTimer = setInterval(() => {
      timeLeft--;
      timerCount.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(authState.resendTimer);
        timerElement.style.display = "none";
        resendBtn.style.display = "block";
      }
    }, 1000);
  }

  function setupVerificationInputs() {
    const inputs = document.querySelectorAll(".verify-input");

    setTimeout(() => {
      inputs[4].focus();
    }, 50);

    inputs.forEach((input, index) => {
      input.value = "";
      input.addEventListener("input", (e) => {
        if (e.target.value) {
          if (index < inputs.length) {
            try {
              inputs[index - 1].focus();
            } catch (err) {
              console.log(err);
            }
          }

          if (index == inputs.length - 5) {
            const code = Array.from(inputs)
              .map((input) => input.value)
              .join("");
            if (code.length === VERIFICATION_CODE_LENGTH) {
              handleVerificationSubmit(code);
            }
          }
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData
          .getData("text")
          .slice(0, VERIFICATION_CODE_LENGTH);
        if (/^\d+$/.test(pastedData)) {
          const reversedData = pastedData.split("").reverse();
          reversedData.forEach((digit, i) => {
            if (i < inputs.length) {
              inputs[i].value = digit;
            }
          });
          inputs[Math.min(reversedData.length, inputs.length) - 1].focus();
        }
      });
    });
  }

document.getElementById("signup-next-btn").addEventListener("click", async (e) => {
  e.preventDefault();
  await handlePhoneSignUp();
});

async function handlePhoneSignUp() {
  const name = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const dateofbirth = document.getElementById("birth-date").value.trim();
  const phone = document.getElementById("login-phone").value.trim();

    if (!name) {
      Toast.fire({
          icon: "error",
          title: "خطا",
          text: "نام و نام خانوادگی الزامی است"
      });
      return;
  }

  if (!dateofbirth) {
      Toast.fire({
          icon: "error",
          title: "خطا",
          text: "تاریخ تولد الزامی است"
      });
      return;
  }

  if (!/^09\d{9}$/.test(phone)) {
      Toast.fire({
          icon: "error",
          title: "خطا",
          text: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"
      });
      return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.fire({
          icon: "error",
          title: "خطا",
          text: "فرمت ایمیل نامعتبر است"
      });
      return;
  }
  authState.signupData = {
      name,
      email,
      dateofbirth,
      phone
  };
  
  try {
      const response = await fetch(baseURL + "?action=sign-up", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }), 
      });

      const result = await response.json();
      
      if (result.success) {
          handleModalVisibility(document.getElementById("profile-completion-modal"), false);
          handleModalVisibility(document.getElementById("verify-modal"), true);
          setupVerificationInputs();
          startResendTimer();

          if (result.code) {
              Toast.fire({
                  icon: "success",
                  title: "کد تایید",
                  text: `کد تایید: ${result.code}`,
                  timer: 3000
              });
          }
      } else {
          Toast.fire({
              icon: "error",
              title: "خطا",
              text: result.message || "خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید."
          });
      }
  } catch (error) {
      console.error("Error in sending verification code:", error);
      Toast.fire({
          icon: "error",
          title: "خطا",
          text: "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید."
      });
  }
}

async function handleVerificationSubmit() {
    const inputs = Array.from(document.querySelectorAll(".verify-input")); 
    const code = inputs.map((input) => input.value.trim()).join("");

    if (code.length !== 5 || !/^\d+$/.test(code)) {
        Toast.fire({
            icon: "error",
            title: "خطا",
            text: "لطفاً کد تایید معتبر وارد کنید.",
        });
        return;
    }

    try {
        const response = await fetch(baseURL + "?action=verify-code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone: authState.phone,
                code: code,
            }),
        });

        const result = await response.json();

        if (result.success) {
            if (authState.signupData) {
                try {
                    const signupResponse = await fetch(baseURL + "?action=sign-up", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(authState.signupData),
                    });

                    const signupResult = await signupResponse.json();

                    if (!signupResult.success) {
                        throw new Error(signupResult.message || "Failed to create account");
                    }
                } catch (error) {
                    console.error("Error creating user account:", error);
                    Toast.fire({
                        icon: "error",
                        title: "خطا",
                        text: "خطا در ایجاد حساب کاربری. لطفاً دوباره تلاش کنید.",
                    });
                    return;
                }
            }

            Toast.fire({
                icon: "success",
                title: "موفقیت",
                text: "ورود با موفقیت انجام شد.",
                timer: 2000
            });

            localStorage.setItem("token", result.token);
            handleModalVisibility(verifyModal, false);
            loginBtn.innerHTML = `<li><a href="#" id="logout-btn">خروج</a></li>`;
            
            authState.signupData = null;
        } else {
            Toast.fire({
                icon: "error",
                title: "خطا",
                text: result.message || "کد تایید نادرست است.",
            });
        }
    } catch (error) {
        console.error("Error verifying code:", error);
        Toast.fire({
            icon: "error",
            title: "خطا",
            text: "خطا در تایید کد. لطفاً دوباره تلاش کنید.",
        });
    }
}
  
  async function handlePhoneSubmit() {
    const phone = document.getElementById("login-phone").value.trim();

    if (!/^09\d{9}$/.test(phone)) {
      Toast.fire({
        icon: "error",
        title: "خطا",
        text: "لطفاً شماره تلفن معتبر وارد کنید",
      });
      return;
    }
    try {
      const response = await fetch(baseURL + "?action=send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }), 
      });

      const result = await response.json();

      console.log(result.message)
      if (result.success) {
        Toast.fire({
          icon: "success",
          title: "موفقیت",
          text: `کد تایید برای شماره ${result.phone} ارسال شد: ${result.code}`, 
        });
        
        authState.phone = phone;

        handleModalVisibility(loginModal, false);
        handleModalVisibility(verifyModal, true);
        setupVerificationInputs();
        startResendTimer();
      }
      else if(result.message === 'phone number is not exist') {
        Toast.fire({
          icon: "success",
          title: "موفقیت",
          text: `لطفا ثبت نام کنید.`, 
        });

        authState.phone = phone;

        handleModalVisibility(loginModal, false);
        handleModalVisibility(signupModal, true);
        handleModalVisibility(verifyModal, false);
        console.log("else if")

      } else {
        Toast.fire({
          icon: "error",
          title: "خطا",
          text: result.message || "خطایی رخ داد",
        });
      }
    } catch (error) {
      console.error("Error sending phone number:", error);
      Toast.fire({
        icon: "error",
        title: "خطا",
        text: "خطا در ارسال شماره. لطفاً دوباره تلاش کنید.",
      });
    }
  }


  async function fetchProducts() {
    try {
      const response = await fetch(baseURL + "?action=get-products");
      const products = await response.json();

      if (!products || products.length === 0) {
        document.querySelector("main").innerHTML =
          "<p>محصولی برای نمایش وجود ندارد.</p>";
        return;
      }

      const groupedProducts = products.reduce((groups, product) => {
        if (!groups[product.category_name]) {
          groups[product.category_name] = [];
        }
        groups[product.category_name].push(product);
        return groups;
      }, {});

      const navMenu = document.getElementById("nav-menu");
      navMenu.innerHTML = Object.keys(groupedProducts)
        .map(
          (category) => `
                <li>
                    <a href="#${category.replace(/\s+/g, "-").toLowerCase()}">
                        <img src="./assets/img/icon-default.png" alt="${category}" class="nav-icon">
                        ${category}
                    </a>
                </li>
            `
        )
        .join("");

      const mainContainer = document.querySelector("main");
      mainContainer.innerHTML = "";

      Object.entries(groupedProducts).forEach(([category, items]) => {
        const sectionId = category.replace(/\s+/g, "-").toLowerCase();
        const section = document.createElement("section");
        section.classList.add("menu-section");
        section.id = sectionId;
        section.innerHTML = `
                    <h2>${category}</h2>
                    <div class="menu-items">
                        ${items
                          .map(
                            (item) => `
                            <div class="menu-item">
                                <img src="${item.image_url}" alt="${item.name}">
                                <div class="detail">
                                    <h3>${item.name}</h3>
                                    <p class="price">${item.base_price.toLocaleString()} تومان</p>
                                </div>
                                <button class="add-to-cart">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `;
        mainContainer.appendChild(section);

      });

      setupScrollBehavior();
    } catch (error) {
      console.error("Error fetching products:", error);
      document.querySelector("main").innerHTML =
        "<p>خطا در دریافت اطلاعات محصولات. لطفاً بعداً دوباره تلاش کنید.</p>";
    }
    document.querySelectorAll(".menu-item").forEach((item) => {
      
      item.addEventListener("click", () => openModal(item));
  });
  }

  function setupScrollBehavior() {
    const navLinks = document.querySelectorAll("#nav-menu a");
    const headerHeight = document.querySelector("header").offsetHeight;

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  }

  const style = document.createElement("style");
  style.textContent = `
        .menu-section {
            scroll-margin-top: 70px; /* Adjust based on your header height */
        }
    `;
  document.head.appendChild(style);

  loginBtn.addEventListener("click", () =>
    handleModalVisibility(loginModal, true)
  );
  nextBtn.addEventListener("click", handlePhoneSubmit);
  signUpNextBtn.addEventListener("click", handlePhoneSignUp);
  verifyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = document.querySelectorAll(".verify-input");
    const code = Array.from(inputs)
      .map((input) => input.value)
      .join("");
    if (code.length === VERIFICATION_CODE_LENGTH) {
      handleVerificationSubmit(code);
    }
  });

  resendBtn.addEventListener("click", handlePhoneSubmit);

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleModalVisibility(loginModal, false);
      handleModalVisibility(verifyModal, false);
      clearInterval(authState.resendTimer);
    });
  });

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      handleModalVisibility(event.target, false);
      clearInterval(authState.resendTimer);
    }
  });

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      closeModalHandler();
    }
  });

  const modal = document.getElementById("food-modal");
  const modalBody = document.getElementById("modal-body");
  const closeModall = document.getElementById("close-modal");
  const quantitySpan = document.getElementById("quantity");
  const increaseBtn = document.getElementById("increase-btn");
  const decreaseBtn = document.getElementById("decrease-btn");
  const addToCartModal = document.getElementById("add-to-cart-modal");

  const productDetails = {
    اسپرسو: {
      description: "میخوای بیدار بمونی؟\nهمینو بگیر",
      customization: {
        "نوع دانه": [
          { name: "عربیکا برزیل", price: 0 },
          { name: "روبوستا ویتنام", price: 2000 },
          { name: "میکس خاص", price: 5000 },
        ],
      },
      basePrice: 10000,
      gallery: [
        "./assets/img/1.jpg",
        "./assets/img/2.jpg",
        "./assets/img/3.jpg",
      ],
    },
  };

  let quantity = 1;
  let currentProductGallery = [];
  let currentProductCustomization = {};
  let currentBasePrice = 0;

  const navLinks = document.querySelectorAll("#nav-menu a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = e.target.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      targetElement.scrollIntoView({ behavior: "smooth" });
    });
  });



  function openModal(item) {
    const itemName = item.querySelector("h3").innerText;
    const price = item.querySelector(".price").innerText;
    const itemImage = item.querySelector("img").src;

    const productInfo = productDetails[itemName] || {
      description: "اطلاعات محصول موجود نیست",
      details: {},
      gallery: [itemImage],
      customization: {},
      basePrice: parseInt(price.replace(/[^0-9]/g, "")),
    };

    currentProductCustomization = {};
    currentBasePrice = productInfo.basePrice;

    const detailsHTML = Object.entries(productInfo.details || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join("");

    const customizationHTML = Object.entries(productInfo.customization || {})
      .map(
        ([category, options]) => `
                <div class="customization-group">
                    <label>${category}</label>
                    <div class="customization-options">
                        ${options
                          .map(
                            (option, index) => `
                            <div class="customization-option" 
                                 data-category="${category}" 
                                 data-name="${option.name}" 
                                 data-price="${option.price}"
                                 onclick="selectCustomization(this)">
                                ${option.name} 
                                ${
                                  option.price > 0
                                    ? `(+ ${option.price.toLocaleString()} تومان)`
                                    : ""
                                }
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
      )
      .join("");

    currentProductGallery = productInfo.gallery;

    modalBody.innerHTML = `
            <div class="modal-product-gallery">
                <img src="${
                  currentProductGallery[0]
                }" alt="${itemName}" class="modal-main-image">
                <div class="gallery-thumbnails">
                    ${currentProductGallery
                      .map(
                        (img, index) => `
                        <img src="${img}" alt="Gallery ${index + 1}" 
                             class="gallery-thumb ${
                               index === 0 ? "active" : ""
                             }"
                             onclick="changeGalleryImage(${index})">
                    `
                      )
                      .join("")}
                </div>
            </div>
            <div class="modal-body-content">
                <h3>${itemName}</h3>
                <p class="modal-price">قیمت: ${price}</p>
                <p class="modal-description">${productInfo.description}</p>
                
                ${
                  customizationHTML
                    ? `
                    <div class="product-customization">
                        <h4>سفارشی سازی محصول</h4>
                        ${customizationHTML}
                    </div>
                `
                    : ""
                }
                
                <h4>جزئیات محصول:</h4>
                <ul class="product-details">
                    ${detailsHTML}
                </ul>
            </div>
        `;

    modal.style.display = "flex";
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);

    quantity = 1;
    updateQuantity();

    document.body.style.overflow = "hidden";
  }

  window.selectCustomization = function (element) {
    const category = element.dataset.category;
    const previousSelected = document.querySelector(
      `.customization-option[data-category="${category}"].selected`
    );

    if (previousSelected) {
      previousSelected.classList.remove("selected");
    }

    element.classList.add("selected");

    currentProductCustomization[category] = {
      name: element.dataset.name,
      price: parseInt(element.dataset.price),
    };

    updateTotalPrice();
  };

  function updateTotalPrice() {
    let additionalPrice = 0;
    Object.values(currentProductCustomization).forEach((option) => {
      additionalPrice += option.price;
    });

    const totalPrice = (currentBasePrice + additionalPrice) * quantity;
    document.querySelector(
      ".modal-price"
    ).innerHTML = `قیمت: ${totalPrice.toLocaleString()} تومان`;
  }

  window.changeGalleryImage = function (index) {
    const mainImage = document.querySelector(".modal-main-image");
    const thumbnails = document.querySelectorAll(".gallery-thumb");

    mainImage.src = currentProductGallery[index];

    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    thumbnails[index].classList.add("active");

    currentGalleryIndex = index;
  };

  function updateQuantity() {
    quantitySpan.innerText = quantity;
    updateTotalPrice();
  }


  function closeModalHandler() {
    modal.classList.remove("show");

    setTimeout(() => {
      modal.style.display = "none";
    }, 300);

    document.body.style.overflow = "auto";
  }

  increaseBtn.addEventListener("click", () => {
    quantity++;
    updateQuantity();
  });

  decreaseBtn.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      updateQuantity();
    }
  });

  addToCartModal.addEventListener("click", () => {
    let customizationDetails = "";
    Object.entries(currentProductCustomization).forEach(
      ([category, option]) => {
        customizationDetails += `${category}: ${option.name}, `;
      }
    );

    const itemName = document.querySelector(".modal-body-content h3").innerText;
    const totalPrice = parseInt(
      document.querySelector(".modal-price").innerText.replace(/[^0-9]/g, "")
    );

    Toast.fire({
      icon: "success",
      title: "افزودن به سبد خرید",
      text: `${quantity} عدد ${itemName} به سبد خرید اضافه شد.`,
    });

    closeModalHandler();
  });

  closeModall.addEventListener("click", closeModalHandler);
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModalHandler();
    }
  });


  let cartItems = [];
  const cartCount = document.querySelector(".cart-count");

  addToCartModal.addEventListener("click", () => {
    let customizationDetails = {};
    Object.entries(currentProductCustomization).forEach(
      ([category, option]) => {
        customizationDetails[category] = option;
      }
    );

    const itemName = document.querySelector(".modal-body-content h3").innerText;
    const itemPrice = parseInt(
      document.querySelector(".modal-price").innerText.replace(/[^0-9]/g, "")
    );

    const existingItemIndex = cartItems.findIndex(
      (item) =>
        item.name === itemName &&
        JSON.stringify(item.customization) ===
          JSON.stringify(customizationDetails)
    );

    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      cartItems.push({
        name: itemName,
        quantity: quantity,
        price: itemPrice,
        customization: customizationDetails,
      });
    }

    cartCount.textContent = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    Toast.fire({
      icon: "success",
      title: "افزودن به سبد خرید",
      text: `${quantity} عدد ${itemName} به سبد خرید اضافه شد.`,
      confirmButtonText: "باشه",
    });

    modal.style.display = "none";
  });

  const cartModal = document.getElementById("cart-modal");
  const cartBtn = document.getElementById("cart-btn");
  const cartItemsContainer = document.querySelector(".cart-items-container");
  const totalAmount = document.querySelector(".total-amount");
  const checkoutBtn = document.getElementById("checkout-btn");

  cartBtn.addEventListener("click", openCartModal);

  function openCartModal() {
    updateCartDisplay();
    handleModalVisibility(cartModal, true);
  }

  function updateCartDisplay() {
    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML =
        '<div class="empty-cart-message">سبد خرید شما خالی است</div>';
      totalAmount.textContent = "0 تومان";
      return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cartItems
      .map((item, index) => {
        total += item.price * item.quantity;

        const customizationHtml = Object.entries(item.customization || {})
          .map(([category, option]) => `${category}: ${option.name}`)
          .join("، ");

        return `
            <div class="cart-item">
                <img src="./assets/img/1.jpg" alt="${
                  item.name
                }" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    ${
                      customizationHtml
                        ? `<div class="cart-item-customization">${customizationHtml}</div>`
                        : ""
                    }
                    <div class="cart-item-price">${(
                      item.price * item.quantity
                    ).toLocaleString()} تومان</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-quantity-control">
                        <button class="cart-quantity-btn" onclick="updateCartItemQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="cart-quantity-btn" onclick="updateCartItemQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="remove-item-btn" onclick="removeCartItem(${index})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
      })
      .join("");

    totalAmount.textContent = `${total.toLocaleString()} تومان`;
  }

  window.updateCartItemQuantity = function (index, change) {
    const item = cartItems[index];
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) return;

    item.quantity = newQuantity;
    updateCartDisplay();
    cartCount.textContent = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  };

  window.removeCartItem = function (index) {
    cartItems.splice(index, 1);
    updateCartDisplay();
    cartCount.textContent = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    if (cartItems.length === 0) {
      handleModalVisibility(cartModal, false);
    }
  };

  checkoutBtn.addEventListener("click", () => {
    if (cartItems.length === 0) {
      Toast.fire({
        icon: "error",
        title: "خطا",
        text: "سبد خرید شما خالی است",
        confirmButtonText: "باشه",
      });
      return;
    }

    Toast.fire({
      icon: "success",
      title: "تکمیل خرید",
      text: "سفارش شما با موفقیت ثبت شد",
      confirmButtonText: "باشه",
    });

    cartItems = [];
    cartCount.textContent = "0";
    handleModalVisibility(cartModal, false);
  });
});
