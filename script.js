const RESEND_DELAY = 60;
const VERIFICATION_CODE_LENGTH = 5;
const PHONE_REGEX = /^09\d{9}$/;

const authState = {
    phone: null,
    verificationId: null,
    resendTimer: null,
    isVerifying: false
};

document.addEventListener("DOMContentLoaded", () => {
    const loginModal = document.getElementById("login-modal");
    const signupModal = document.getElementById("profile-completion-modal");
    const verifyModal = document.getElementById("verify-modal");
    const loginBtn = document.getElementById("login-btn");
    const nextBtn = document.getElementById("next-btn");
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
        }
    })

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
                        try{
                            inputs[index - 1].focus();
                        }
                        catch(err){
                            console.log(err)
                        }
                    }

                    if (index == inputs.length - 5 ) {
                        const code = Array.from(inputs).map(input => input.value).join("");
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
                const pastedData = e.clipboardData.getData("text").slice(0, VERIFICATION_CODE_LENGTH);
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

    async function handlePhoneSubmit() {
        const phone = phoneInput.value.trim();
        
        if (!validatePhoneNumber(phone)) {
            Toast.fire({
                icon: "error",
                title: "خطا",
                text: "لطفاً شماره تلفن معتبر وارد کنید",
            });
            return;
        }

        try {
            authState.phone = phone;
            handleModalVisibility(loginModal, false);
            setTimeout(() => {
                handleModalVisibility(verifyModal, true);
                setupVerificationInputs();
                startResendTimer();
            }, 300);
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "خطا",
                text: "خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.",
            });
        }
    }

    async function handleVerificationSubmit(code) {
        if (authState.isVerifying) return;
        
        authState.isVerifying = true;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Toast.fire({
                icon: "success",
                title: "تایید موفقیت‌آمیز",
                text: "به حساب کاربری خود خوش آمدید",
            });
            
            handleModalVisibility(verifyModal, false);
            clearInterval(authState.resendTimer);
            
            loginBtn.textContent = "حساب کاربری";
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "خطا",
                text: "کد تایید نادرست است. لطفاً دوباره تلاش کنید.",
            });
        } finally {
            authState.isVerifying = false;
        }
    }

    loginBtn.addEventListener("click", () => handleModalVisibility(loginModal, true));
    nextBtn.addEventListener("click", handlePhoneSubmit);
    verifyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll(".verify-input");
        const code = Array.from(inputs).map(input => input.value).join("");
        if (code.length === VERIFICATION_CODE_LENGTH) {
            handleVerificationSubmit(code);
        }
    });

    resendBtn.addEventListener("click", async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Toast.fire({
                icon: "success",
                title: "ارسال مجدد",
                text: "کد تایید جدید ارسال شد",
            });
            
            setupVerificationInputs();
            startResendTimer();
        } catch (error) {
            Toast.fire({
                icon: "error",
                title: "خطا",
                text: "خطا در ارسال مجدد کد. لطفاً دوباره تلاش کنید.",
            });
        }
    });

    closeButtons.forEach(button => {
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
    function openModal(modal) {
        if (!modal) {
            console.error("Modal element not found");
            return;
        }
        modal.style.display = "flex";
        modal.classList.add("show");
    }
    

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
        'اسپرسو': {
            description: 'میخوای بیدار بمونی؟\nهمینو بگیر',
            customization: {
                'نوع دانه': [
                    { name: 'عربیکا برزیل', price: 0 },
                    { name: 'روبوستا ویتنام', price: 2000 },
                    { name: 'میکس خاص', price: 5000 }
                ]
            },
            basePrice: 10000,
            gallery: [
                './assets/img/1.jpg',
                './assets/img/2.jpg',
                './assets/img/3.jpg'
            ]
        }
    };

    let quantity = 1;
    let currentProductGallery = [];
    let currentProductCustomization = {};
    let currentBasePrice = 0;

    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    function openModal(item) {
        const itemName = item.querySelector("h3").innerText;
        const price = item.querySelector(".price").innerText;
        const itemImage = item.querySelector("img").src;

        const productInfo = productDetails[itemName] || {
            description: 'اطلاعات محصول موجود نیست',
            details: {},
            gallery: [itemImage],
            customization: {},
            basePrice: parseInt(price.replace(/[^0-9]/g, ''))
        };

        currentProductCustomization = {};
        currentBasePrice = productInfo.basePrice;

        const detailsHTML = Object.entries(productInfo.details || {})
            .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
            .join('');

        const customizationHTML = Object.entries(productInfo.customization || {})
            .map(([category, options]) => `
                <div class="customization-group">
                    <label>${category}</label>
                    <div class="customization-options">
                        ${options.map((option, index) => `
                            <div class="customization-option" 
                                 data-category="${category}" 
                                 data-name="${option.name}" 
                                 data-price="${option.price}"
                                 onclick="selectCustomization(this)">
                                ${option.name} 
                                ${option.price > 0 ? `(+ ${option.price.toLocaleString()} تومان)` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

        currentProductGallery = productInfo.gallery;

        modalBody.innerHTML = `
            <div class="modal-product-gallery">
                <img src="${currentProductGallery[0]}" alt="${itemName}" class="modal-main-image">
                <div class="gallery-thumbnails">
                    ${currentProductGallery.map((img, index) => `
                        <img src="${img}" alt="Gallery ${index + 1}" 
                             class="gallery-thumb ${index === 0 ? 'active' : ''}"
                             onclick="changeGalleryImage(${index})">
                    `).join('')}
                </div>
            </div>
            <div class="modal-body-content">
                <h3>${itemName}</h3>
                <p class="modal-price">قیمت: ${price}</p>
                <p class="modal-description">${productInfo.description}</p>
                
                ${customizationHTML ? `
                    <div class="product-customization">
                        <h4>سفارشی سازی محصول</h4>
                        ${customizationHTML}
                    </div>
                ` : ''}
                
                <h4>جزئیات محصول:</h4>
                <ul class="product-details">
                    ${detailsHTML}
                </ul>
            </div>
        `;

        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        quantity = 1;
        updateQuantity();

        document.body.style.overflow = 'hidden';
    }

    window.selectCustomization = function(element) {
        const category = element.dataset.category;
        const previousSelected = document.querySelector(
            `.customization-option[data-category="${category}"].selected`
        );
        
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        element.classList.add('selected');
        
        currentProductCustomization[category] = {
            name: element.dataset.name,
            price: parseInt(element.dataset.price)
        };
        
        updateTotalPrice();
    };

    function updateTotalPrice() {
        let additionalPrice = 0;
        Object.values(currentProductCustomization).forEach(option => {
            additionalPrice += option.price;
        });
        
        const totalPrice = (currentBasePrice + additionalPrice) * quantity;
        document.querySelector('.modal-price').innerHTML = 
            `قیمت: ${totalPrice.toLocaleString()} تومان`;
    }

    window.changeGalleryImage = function(index) {
        const mainImage = document.querySelector('.modal-main-image');
        const thumbnails = document.querySelectorAll('.gallery-thumb');
        
        mainImage.src = currentProductGallery[index];
        
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index].classList.add('active');
        
        currentGalleryIndex = index;
    };

    function updateQuantity() {
        quantitySpan.innerText = quantity;
        updateTotalPrice();
    }

    function closeModalHandler() {
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
        
        document.body.style.overflow = 'auto';
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

    addToCartModal.addEventListener('click', () => {
        let customizationDetails = '';
        Object.entries(currentProductCustomization).forEach(([category, option]) => {
            customizationDetails += `${category}: ${option.name}, `;
        });

        const itemName = document.querySelector('.modal-body-content h3').innerText;
        const totalPrice = parseInt(
            document.querySelector('.modal-price')
            .innerText.replace(/[^0-9]/g, '')
        );

        Toast.fire({
            icon: 'success',
            title: 'افزودن به سبد خرید',
            text: `${quantity} عدد ${itemName} به سبد خرید اضافه شد.`,
        });

        closeModalHandler()
    });

    closeModall.addEventListener("click", closeModalHandler);
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModalHandler();
        }
    });

    document.querySelectorAll(".menu-item").forEach((item) => {
        item.addEventListener("click", () => openModal(item));
    });
    let cartItems = [];
const cartCount = document.querySelector('.cart-count');

addToCartModal.addEventListener('click', () => {
    let customizationDetails = '';
    Object.entries(currentProductCustomization).forEach(([category, option]) => {
        customizationDetails += `${category}: ${option.name}, `;
    });

    const itemName = document.querySelector('.modal-body-content h3').innerText;
    const totalPrice = parseInt(
        document.querySelector('.modal-price')
        .innerText.replace(/[^0-9]/g, '')
    );

    cartItems.push({
        name: itemName,
        quantity: quantity,
        price: totalPrice,
        customization: currentProductCustomization
    });

    cartCount.textContent = cartItems.length;

    Toast.fire({
        icon: 'success',
        title: 'افزودن به سبد خرید',
        text: `${quantity} عدد ${itemName} به سبد خرید اضافه شد.`,
        confirmButtonText: 'باشه'
    });

    modal.style.display = 'none';
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
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">سبد خرید شما خالی است</div>';
            totalAmount.textContent = '0 تومان';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = cartItems.map((item, index) => {
            total += item.price * item.quantity;
            
            const customizationHtml = Object.entries(item.customization || {})
                .map(([category, option]) => `${category}: ${option.name}`)
                .join('، ');

            return `
                <div class="cart-item">
                    <img src="./assets/img/1.jpg" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        ${customizationHtml ? `<div class="cart-item-customization">${customizationHtml}</div>` : ''}
                        <div class="cart-item-price">${(item.price * item.quantity).toLocaleString()} تومان</div>
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
        }).join('');

        totalAmount.textContent = `${total.toLocaleString()} تومان`;
    }

    window.updateCartItemQuantity = function(index, change) {
        const item = cartItems[index];
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) return;
        
        item.quantity = newQuantity;
        updateCartDisplay();
        cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    window.removeCartItem = function(index) {
        cartItems.splice(index, 1);
        updateCartDisplay();
        cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartItems.length === 0) {
            handleModalVisibility(cartModal, false);
        }
    }

    checkoutBtn.addEventListener("click", () => {
        if (cartItems.length === 0) {
            Toast.fire({
                icon: 'error',
                title: 'خطا',
                text: 'سبد خرید شما خالی است',
                confirmButtonText: 'باشه'
            });
            return;
        }
        
        Toast.fire({
            icon: 'success',
            title: 'تکمیل خرید',
            text: 'سفارش شما با موفقیت ثبت شد',
            confirmButtonText: 'باشه'
        });
        
        cartItems = [];
        cartCount.textContent = "0";
        handleModalVisibility(cartModal, false);
    });
});