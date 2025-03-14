// frontend/screens/expense/AddExpenseScreen/styles.js
import { StyleSheet } from "react-native";
import { COLORS } from "../../../utils/constants";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 16,
  },
  formContainer: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 24,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: COLORS.dark,
  },
  subLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  amountInputDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  amountButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 8,
  },
  confirmedAmountText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.lightGray,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  categoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  categoryButtonText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  categoryPicker: {
    marginTop: 8,
    maxHeight: 200,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  categoryItemText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  membersContainer: {
    marginBottom: 16,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectMembersButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  selectMembersText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },
  selectedMembersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  selectedMemberChip: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  selectedMemberText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  noMemberText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontStyle: "italic",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  participantsContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  participantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  participantInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantName: {
    fontSize: 14,
    color: COLORS.dark,
  },
  participantShare: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
  },
  equalShareAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 8,
    width: 100,
    textAlign: "right",
  },
  customShareContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 200,
  },
  customShareInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    fontSize: 14,
    textAlign: "right",
  },
  customShareSuffix: {
    fontSize: 14,
    color: COLORS.secondary,
    width: 60,
  },
  remainingButton: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  remainingButtonText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
  },
  customSplitOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  splitOptionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 36,
  },
  totalContainer: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  errorBalanceText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 8,
    fontStyle: "italic",
  },
  balanceText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 8,
    fontStyle: "italic",
  },
  submitButton: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 12,
  },
  memberSelectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: COLORS.dark,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxSelected: {
    backgroundColor: COLORS.primary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  confirmButton: {
    marginTop: 12,
  },
  payerSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  payerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: 5,
  },
  payerSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  payerName: {
    fontSize: 16,
  },

  // Thêm styles cho tùy chọn chia ngẫu nhiên trực tiếp
  randomSplitContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  randomSplitTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  randomSplitOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  randomSplitOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  randomSplitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  randomSplitLabel: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
  },
  randomSplitCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  randomSplitCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  randomSplitCheckboxLabel: {
    fontSize: 12,
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  randomSplitFreeButton: {
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  randomSplitSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // Styles cho thông tin modal
  modalContent: {
    marginBottom: 16,
    maxHeight: 350,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalListItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 8,
  },
  modalBullet: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
  },
  modalListText: {
    fontSize: 14,
    color: COLORS.secondary,
    flex: 1,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Styles cho người được miễn phí
  freeResultItem: {
    backgroundColor: "rgba(76, 175, 80, 0.1)", // Màu nền nhẹ cho item miễn phí
  },
  freeLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "bold",
  },
  freeResultAmount: {
    color: COLORS.success,
    fontWeight: "bold",
  },
  // Styles cho radio button
  radioGroup: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.dark,
  },
  executeRandomButton: {
    paddingVertical: 10,
    marginVertical: 8,
  },
});

export default styles;
