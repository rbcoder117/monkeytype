import * as DB from "../db";
import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";

function refreshList(): void {
  const data = DB.getSnapshot().apeKeys;
  if (!data) return;
  const table = $("#apeKeysPopupWrapper table tbody");
  table.empty();
  const apeKeyIds = Object.keys(data);
  if (apeKeyIds.length === 0) {
    table.append(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>"
    );
    return;
  }
  apeKeyIds.forEach((apeKeyId) => {
    const key = data[apeKeyId] as MonkeyTypes.ApeKey;
    table.append(`
      <tr keyId="${apeKeyId}">
        <td>
          <div class="icon-button">
            ${
              key.enabled
                ? `<i class="fas fa-check-square"></i>`
                : `<i class="far fa-fw fa-square"></i>`
            }
          </div>
        </td>
        <td>${key.name}</td>
        <td>${moment(key.createdOn).format("DD MMM YYYY HH:mm")}</td>
        <td>${moment(key.modifiedOn).format("DD MMM YYYY HH:mm")}</td>
        <td>${
          key.lastUsedOn === -1
            ? "-"
            : moment(key.lastUsedOn).format("DD MMM YYYY HH:mm")
        }</td>
        <td>
          <div class="keyButtons">
            <div class="button edit">
              <i class="fas fa-fw fa-pen"></i>
            </div>
            <div class="button delete">
              <i class="fas fa-fw fa-trash-alt"></i>
            </div>
          </div>
        </td>
      </tr>
    `);
  });
}

export function hide(): void {
  if (!$("#apeKeysPopupWrapper").hasClass("hidden")) {
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#apeKeysPopupWrapper").addClass("hidden");
        }
      );
  }
}

//show the popup
export async function show(): Promise<void> {
  if ($("#apeKeysPopupWrapper").hasClass("hidden")) {
    Loader.show();
    await DB.getUserApeKeys();
    Loader.hide();
    refreshList();
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        100,
        () => {
          $("#apeKeysPopup textarea").focus().select();
        }
      );
  }
}

$("#apeKeysPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "apeKeysPopupWrapper") {
    hide();
  }
});

$("#apeKeysPopup .generateApeKey").on("click", () => {
  hide();
});

$(document).on("click", "#apeKeysPopup table .keyButtons .button", () => {
  hide();
});

$(document).on("click", "#apeKeysPopup table .icon-button", async (e) => {
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  const snap = DB.getSnapshot();
  const key = snap.apeKeys?.[keyId];
  if (!key || !snap.apeKeys) return;
  Loader.show();
  const response = await Ape.apeKeys.update(keyId, { enabled: !key.enabled });
  Loader.hide();
  if (response.status !== 200) {
    return Notifications.add("Failed to update key: " + response.message, -1);
  }
  snap.apeKeys[keyId].enabled = !key.enabled;
  DB.setSnapshot(snap);
  refreshList();
  if (key.enabled) {
    Notifications.add("Key active", 1);
  } else {
    Notifications.add("Key inactive", 1);
  }
});