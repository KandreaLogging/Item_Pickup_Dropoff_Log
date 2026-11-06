
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAmQhEnSxq0wONU16sTO3mvNCFInVXsORvfpcdB27pkaTvifI060NLNbjXGizC3AYZow/exec";

let selectedActionValue = "";
let selectedAssetTypeValue = "";

function selectAction(action) {
  selectedActionValue = action;
  document.getElementById("actionType").value = action;

  const btnPickup = document.getElementById("btnPickup");
  const btnDropoff = document.getElementById("btnDropoff");

  if (action === "Pickup") {
    btnPickup.classList.add("active-pickup");
    btnDropoff.classList.remove("active-dropoff");
  } else {
    btnDropoff.classList.add("active-dropoff");
    btnPickup.classList.remove("active-pickup");
  }
}

function selectAssetType(type) {
  selectedAssetTypeValue = type;
  document.getElementById("assetType").value = type;

  const btnVehicle = document.getElementById("btnVehicle");
  const btnTrailer = document.getElementById("btnTrailer");
  const container = document.getElementById("assetDetailContainer");
  const label = document.getElementById("assetDetailLabel");
  const input = document.getElementById("assetDetailInput");

  if (type === "Vehicle") {
    btnVehicle.classList.add("active-asset");
    btnTrailer.classList.remove("active-asset");
    label.innerHTML = 'Unit # <span class="required">*</span>';
    input.placeholder = "Enter Vehicle Unit #";
  } else {
    btnTrailer.classList.add("active-asset");
    btnVehicle.classList.remove("active-asset");
    label.innerHTML = 'License Plate # <span class="required">*</span>';
    input.placeholder = "Enter Trailer License Plate #";
  }

  container.style.display = "block";
  input.required = true;
}

document.getElementById("logForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const statusMsg = document.getElementById("statusMessage");

  if (!selectedActionValue) {
    alert("Please select either Pickup or Drop-off.");
    return;
  }

  if (!selectedAssetTypeValue) {
    alert("Please select whether this entry is for a Vehicle or Trailer.");
    return;
  }

  const assetDetail = document.getElementById("assetDetailInput").value.trim();
  if (!assetDetail) {
    alert(`Please enter the required ${selectedAssetTypeValue === 'Vehicle' ? 'Unit #' : 'License Plate #'}.`);
    return;
  }

  const fileInput = document.getElementById("photoFile");
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("A photo attachment is mandatory.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Submitting...";
  statusMsg.style.display = "none";

  try {
    const file = fileInput.files[0];
    const base64Photo = await convertFileToBase64(file);

    const timestamp = new Date().toLocaleString("en-CA", {
      timeZone: "America/Edmonton",
      dateStyle: "short",
      timeStyle: "medium"
    });

    const payload = {
      timestamp: timestamp,
      action: selectedActionValue,
      employeeDriverName: document.getElementById("employeeName").value.trim(),
      projectSiteName: document.getElementById("projectSite").value.trim(),
      locationZone: document.getElementById("locationZone").value,
      assetType: selectedAssetTypeValue,
      assetDetail: assetDetail,
      fileName: `Log_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`,
      mimeType: file.type || "image/jpeg",
      photoBase64: base64Photo
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      statusMsg.style.display = "block";
      statusMsg.style.backgroundColor = "#d4edda";
      statusMsg.style.color = "#155724";
      statusMsg.innerText = "Success! Entry logged and notifications sent.";
      
      document.getElementById("logForm").reset();
      selectedActionValue = "";
      selectedAssetTypeValue = "";
      document.getElementById("assetDetailContainer").style.display = "none";
      document.getElementById("btnPickup").classList.remove("active-pickup");
      document.getElementById("btnDropoff").classList.remove("active-dropoff");
      document.getElementById("btnVehicle").classList.remove("active-asset");
      document.getElementById("btnTrailer").classList.remove("active-asset");
    } else {
      throw new Error(result.message || "Failed to log entry");
    }
  } catch (err) {
    statusMsg.style.display = "block";
    statusMsg.style.backgroundColor = "#f8d7da";
    statusMsg.style.color = "#721c24";
    statusMsg.innerText = "Error logging entry. Please check your connection and try again.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Log Entry";
  }
});

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
}
