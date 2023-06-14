<template lang="pug">

report-template-advanced-config-dialog(
  v-model="advancedConfigDialog"
  :config-model="config"
)

q-header(bordered).text-black.bg-white
  q-toolbar
    q-btn(
      icon="la la-arrow-left"
      dense
      flat
      round
      @click="goBack"
    )
    q-toolbar-title {{isUpdating ? 'Update' : 'Create'}} Report Template
      q-chip(v-if="isArchived" color="warning") Archived
      q-chip(v-if="formTemplateAlreadyInUse" color="green").text-white In Use
        q-icon(name="la la-question-circle" size="20px")
          q-tooltip It indicates that a current encounter is already utilizing this template. Therefore, it's not possible to alter or remove the template.
    q-space
    q-btn(
      v-if="isUpdating"
      icon="la la-cog"
      color="primary"
      label="More Options"
      dense
      unelevated
      outline
      no-caps
      :disable="disableEditing"
    )
      q-menu(anchor="bottom end" self="top right")
        q-list(style="width: 200px")
          template(v-if="isArchived")
            q-item(clickable v-close-popup @click="onUnarchive")
              q-item-section(avatar)
                q-icon(name="las la-archive").text-positive
              q-item-section Unarchive
          template(v-else)
            q-item(clickable v-close-popup @click="onArchive")
              q-item-section(avatar)
                q-icon(name="las la-archive").text-warning
              q-item-section Archive
          q-item(clickable v-close-popup @click="onDelete")
            q-item-section(avatar)
              q-icon(name="las la-trash").text-negative
            q-item-section Delete

q-banner(v-if="isArchived" inline-actions class="bg-warning text-white")
  span.text-black This Form Template is archived
  template(v-slot:action)
    q-btn(
      label="Unarchive"
      color="black"
      flat
      no-caps
      @click="onUnarchive"
    )

generic-page(
  skeleton="table"
  padding
  :loading="loading"
)
  q-card(flat)
    //- q-card-section.q-pa-0
      search-form-template-tokens(@select="onTokenSelect" style="width: 100%")
    q-card-section.q-pa-0
      div.row.items-center.q-gutter-sm.q-mb-sm
        div.block.text-medium Tokens:
        q-btn(
          label="Add Tokens"
          color="primary"
          icon="las la-code"
          outline
          no-caps
          :disable="disableEditing"
          @click="tokensDialog = true"
        )
        q-btn(
          label="Custom Text"
          color="primary"
          icon="las la-keyboard"
          outline
          no-caps
          :disable="disableEditing"
          @click="customTextDialog = true"
        )
        q-btn(
          label="Custom Options"
          color="primary"
          icon="las la-caret-square-down"
          outline
          no-caps
          :disable="disableEditing"
          @click="customDropdownDialog = true"
        )
        q-btn(
          label="Table"
          color="primary"
          icon="las la-table"
          outline
          no-caps
          :disable="disableEditing"
          @click="customTableDialog = true"
        )
      div.row.items-center.q-gutter-sm
        span.text-medium UI Components:
        q-btn(
          label="Medical History Group"
          color="primary"
          icon="las la-table"
          outline
          no-caps
          :disable="disableEditing"
          @click="insertMedicalHistoryGroup"
        )
    q-card-section.q-pa-0
      q-editor(
        ref="editorRef"
        v-model="editorTemplate"
        height="60vh"
        :disable="disableEditing"
        :dense="$q.screen.lt.md"
        :toolbar="editorToolbarOptions"
        :fonts="editorFontOptions"
      )
      //- pre {{(config || {}).records}}
      //- pre {{reportTemplateConfig}}

  q-dialog(v-model="tokensDialog" position="top")
    q-card
      q-card-section
        search-form-template-tokens(@select="onTokenSelect")

  q-drawer(
    v-model="leftDrawer"
    side="left"
    show-if-above
    bordered
    :width="500"
  )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Template Information
      div.col-xs-12.q-pa-md
        q-form(ref="mainFormRef")
          q-input(
            v-model="name"
            label="Template Name"
            outlined
            :disable="disableEditing"
            :rules="[v => !!v || 'Template name is required']"
          ).q-mb-md
          q-input(
            v-model="description"
            type="textarea"
            label="Template Description"
            outlined
            :disable="disableEditing"
          )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Template Configurations
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="disableClinicHeader"
          :disable="disableEditing"
          label="Hide default clinic header"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="disablePatientHeader"
          :disable="disableEditing"
          label="Hide default patient header"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="disableTemplateNameHeading"
          :disable="disableEditing"
          label="Hide default name header"
        )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 Signatories Configuration
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="hideExaminedBy"
          :disable="disableEditing"
          label="Hide Medical Examiner"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="hideReviewedBy"
          :disable="disableEditing"
          label="Hide Evaluator"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="hideCreatedBy"
          :disable="disableEditing"
          label="Hide Processor"
        )
      div.col-xs-12.q-pa-md
        q-checkbox(
          v-model="hideFinalizedBy"
          :disable="disableEditing"
          label="Hide Finalizer"
        )
    div.row
      div.col-xs-12.q-pa-md
        span.text-subtitle1 More Advanced Configurations
      div.col-xs-12.q-pa-md
        q-btn(
          label="Show More Configurations"
          color="primary"
          unelevated
          no-caps
          :disable="disableEditing"
          @click="advancedConfigDialog = !advancedConfigDialog"
        ).full-width.q-mb-md

//- LOCAL DIALOGS
q-dialog(v-model="customTextDialog")
  q-card(style="width: 500px")
    q-toolbar
      q-toolbar-title Add a Custom Text
      q-btn(
        icon="la la-times"
        flat
        rounded
        @click="customTextDialog = false"
      )
    q-card-section
      q-form(ref="customTextFormRef" @submit.prevent="insertCustomText")
        q-input(
          v-model="customText"
          label="Custom Text"
          outlined
          autofocus
          :rules="[v => !!v || 'This is required']"
        )
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Submit"
        color="primary"
        unelevated
        no-caps
        @click="insertCustomText"
      )

q-dialog(v-model="customDropdownDialog")
  q-card(style="width: 500px")
    q-toolbar
      q-toolbar-title Add a Custom Dropdown
      q-btn(
        icon="la la-times"
        flat
        rounded
        @click="customDropdownDialog = false"
      )
    q-card-section
      q-form(ref="customDropdownFormRef" @submit.prevent="insertCustomDropdown")
        div.row.q-mt-sm
          p Question
        q-input(
          v-model="dropdownQuestion"
          label="Absence in, Patient Work, etc"
          outlined
          dense
          autofocus
          :rules="[v => !!v || 'This is required']"
        ).q-mb-sm
        q-separator
        div.row.q-mt-sm
          p Add at least one dropdown option
        template(v-for="(opt, index) in dropdownOptions")
          div.row.q-mb-sm
            div.col-grow.q-mr-sm
              q-input(
                v-model="opt.option"
                label="Option"
                outlined
                dense
                :rules="[v => !!v || 'This is required']"
              )
            div
              q-btn(
                icon="la la-times"
                color="negative"
                size="small"
                flat
                round
                @click="removeOption(index)"
              )
        div.column
          q-btn(
            label="Add a new option"
            color="primary"
            icon="la la-plus"
            block
            flat
            no-caps
            @click="addOption"
          )
    q-separator
    q-card-actions
      q-space
      q-btn(
        label="Submit"
        color="primary"
        unelevated
        no-caps
        @click="insertCustomDropdown"
      )

q-dialog(v-model="customTableDialog")
  q-card(style="width: 700px")
    q-form(ref="customTableFormRef" @submit.prevent="insertCustomTable")
      q-toolbar
        q-toolbar-title Add a Custom Table
        q-btn(
          icon="la la-times"
          flat
          rounded
          @click="customTableDialog = false"
        )
      q-card-section
        div.row
          div.col-xs-12.col-md-6.q-pa-sm
            q-input(
              v-model="tableRows"
              label="Table rows"
              type="number"
              min="1"
              max="100"
              skip="1"
              outlined
              dense
              autofocus
              :rules="[v => !!v || 'This is required', v => (Number(v) >= 1 && Number(v) <= 100) || 'Table rows must be 1 - 100 only' ]"
            )
          div.col-xs-12.col-md-6.q-pa-sm
            q-input(
              v-model="tableColumns"
              label="Table columns"
              type="number"
              min="1"
              max="100"
              skip="1"
              outlined
              dense
              :rules="[v => !!v || 'This is required', v => (Number(v) >= 1 && Number(v) <= 100) || 'Table columns must be 1 - 100 only' ]"
            )
          div(style="overflow: auto; max-height: 500px;").col-xs-12.q-pa-sm
            table
              template(v-for="(row, rowIndex) in Number(tableRows)")
                tr
                  template(v-for="(col, colIndex) in Number(tableColumns)")
                    td(style="padding: 10px;")

      q-separator
      q-card-actions
        q-space
        q-btn(
          label="Insert a new table"
          color="primary"
          icon="la la-plus"
          type="submit"
          unelevated
          no-caps
        )

q-footer(
  bordered
).bg-white
  q-toolbar
    q-space
    q-btn(
      color="primary"
      unelevated
      no-caps
      :label="`${isUpdating ? 'Update' : 'Create'} Report`"
      :disabled="formTemplateAlreadyInUse"
      @click="submit"
    )
</template>

<script>
import { customAlphabet } from 'nanoid';
import { cloneDeep } from 'lodash';
import {
  archiveFormTemplate,
  createFormTemplate,
  getFormTemplate,
  removeFormTemplate,
  unarchiveFormTemplate,
} from '@/services/form-templates';
import { capitalized, fakeAwait, superTrim } from '@/utils';
import { getApeReportsUsingTemplate } from '@/services/medical-records';
import { onMounted, ref, watch, computed } from 'vue';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/current-user';
import GenericPage from '@/components/commons/GenericPage';
// import pmeHelper from '@/composables/pme-helpers';
import pmeHelper from '@/composables/pme-helpers';
import SearchFormTemplateTokens from '@/components/commons/search/SearchFormTemplateTokens';
import ReportTemplateAdvancedConfigDialog from '@/components/pme/ReportTemplateAdvancedConfigDialog';

const nanoid = customAlphabet('1234567890abcdef', 10);

export default {
  components: {
    GenericPage,
    ReportTemplateAdvancedConfigDialog,
    SearchFormTemplateTokens,
  },
  setup () {
    const {
      TEMPLATE_TOKENS_MAP,
    } = pmeHelper();
    // const {
    //   getSummaryReportFields,
    // } = useEditorHelper();
    const { q, confirm, showSnack } = useQuasarMixins();
    const editorRef = ref(null);
    const leftDrawer = ref(false);
    const loading = ref(false);
    const route = useRoute();
    const router = useRouter();
    const tokensDialog = ref(false);
    const customDropdownFormRef = ref(null);
    const customDropdownDialog = ref(false);
    const dropdownQuestion = ref('');
    const dropdownOptions = ref([{ option: '' }]);
    const chosenCustomDropdown = ref([]);
    const customTextDialog = ref(false);
    const customText = ref('');
    const customTextFormRef = ref(null);
    const formTemplateAlreadyInUse = ref(false);
    const mainFormRef = ref(null);
    const advancedConfigDialog = ref(false);

    watch(dropdownOptions, (v) => console.warn('dropdownOptions', v), { deep: true });

    // Report models
    const description = ref('');
    const formTemplate = ref({});
    const name = ref('');
    const formTemplateId = route.params.reportTemplate;
    const editorTemplate = ref('');
    const rawTemplate = ref('');

    const userStore = useUserStore();
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);

    // Config
    const disableClinicHeader = ref(false);
    const disablePatientHeader = ref(false);
    const disableTemplateNameHeading = ref(false);
    const hideExaminedBy = ref(false);
    const hideReviewedBy = ref(false);
    const hideCreatedBy = ref(false);
    const hideFinalizedBy = ref(false);
    const reportTemplateConfig = computed(() => formTemplate.value?.config || {});
    const config = ref(reportTemplateConfig.value.hiddenItemsInPMEReport || { record: {} }); // Initial value

    const isArchived = computed(() => !!formTemplate.value?.hiddenAt);
    const isUpdating = computed(() => {
      return !!formTemplateId;
    });
    const disableEditing = computed(() => isArchived.value || formTemplateAlreadyInUse.value);

    const editorFontOptions = {
      arial: 'Arial',
      arial_black: 'Arial Black',
      comic_sans: 'Comic Sans MS',
      courier_new: 'Courier New',
      impact: 'Impact',
      lucida_grande: 'Lucida Grande',
      times_new_roman: 'Times New Roman',
      verdana: 'Verdana',
    };

    const editorToolbarOptions = [
      [
        {
          label: q.lang.editor.align,
          icon: q.iconSet.editor.align,
          fixedLabel: true,
          list: 'only-icons',
          options: ['left', 'center', 'right', 'justify'],
        },
        {
          label: q.lang.editor.align,
          icon: q.iconSet.editor.align,
          fixedLabel: true,
          options: ['left', 'center', 'right', 'justify'],
        },
      ],
      ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
      ['token', 'hr', 'link', 'custom_btn'],
      ['print', 'fullscreen'],
      [
        {
          label: q.lang.editor.formatting,
          icon: q.iconSet.editor.formatting,
          list: 'no-icons',
          options: [
            'p',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'code',
          ],
        },
        {
          label: q.lang.editor.fontSize,
          icon: q.iconSet.editor.fontSize,
          fixedLabel: true,
          fixedIcon: true,
          list: 'no-icons',
          options: [
            'size-1',
            'size-2',
            'size-3',
            'size-4',
            'size-5',
            'size-6',
            'size-7',
          ],
        },
        {
          label: q.lang.editor.defaultFont,
          icon: q.iconSet.editor.font,
          fixedIcon: true,
          list: 'no-icons',
          options: [
            'default_font',
            'arial',
            'arial_black',
            'comic_sans',
            'courier_new',
            'impact',
            'lucida_grande',
            'times_new_roman',
            'verdana',
          ],
        },
        'removeFormat',
      ],
      ['quote', 'unordered', 'ordered', 'outdent', 'indent'],
      ['undo', 'redo'],
      ['viewsource'],
    ];

    watch(editorTemplate, (val) => {
      if (val?.includes('::')) {
        tokensDialog.value = true;
      }
      updateRawTemplate();
    }, { immediate: true });

    onMounted(() => {
      isUpdating.value && init();
    });

    async function init () {
      try {
        formTemplate.value = await getFormTemplate(formTemplateId);
        console.warn('formTemplate.value', formTemplate.value);
        disableClinicHeader.value = !!formTemplate.value?.config?.disableClinicHeader || false;
        disablePatientHeader.value = !!formTemplate.value?.config?.disablePatientHeader || false;
        disableTemplateNameHeading.value = !!formTemplate.value?.config?.disableTemplateNameHeading || false;
        hideExaminedBy.value = !!formTemplate.value?.config?.hideExaminedBy || false;
        hideReviewedBy.value = !!formTemplate.value?.config?.hideReviewedBy || false;
        hideCreatedBy.value = !!formTemplate.value?.config?.hideCreatedBy || false;
        hideFinalizedBy.value = !!formTemplate.value?.config?.hideFinalizedBy || false;
        config.value = formTemplate.value?.config || {};

        const formTemplateItems = formTemplate.value?.items || [];
        chosenCustomDropdown.value = formTemplateItems.map(item => {
          return {
            choices: item.choices,
            question: item.question,
            type: item.type,
          };
        });

        const { items } = await getApeReportsUsingTemplate({ template: formTemplateId });
        formTemplateAlreadyInUse.value = !!items?.length;
        name.value = formTemplate.value.name;
        description.value = formTemplate.value.description;
        setTokenToChip(formTemplate.value);

        // HACK: For some reason the rawTemplate ref is not being
        // updated on initial load of the app
        setTimeout(() => editorRef.value.runCmd('insertHTML', ' '));
      } catch (e) {
        console.error(e);
      }
    }

    async function submit () {
      try {
        if (isUpdating.value) {
          await removeFormTemplate(formTemplateId);
          create();
          return;
        }
        create();
      } catch (e) {
        console.error(e);
      }
    }

    async function create () {
      try {
        if (!await mainFormRef.value.validate()) return;
        if (!rawTemplate.value) {
          showSnack({
            message: 'The template is empty',
            color: 'warning',
          });
          return;
        }

        const hiddenItemsInPMEReport = { ...config.value?.hiddenItemsInPMEReport };
        const records = { ...config.value?.records };

        updateRawTemplate();

        const payload = {
          type: 'ape-report',
          facility: activeOrganization.value.id,
          name: name.value,
          description: description.value,
          template: rawTemplate.value,
          config: {
            disableClinicHeader: disableClinicHeader.value,
            disablePatientHeader: disablePatientHeader.value,
            disableTemplateNameHeading: disableTemplateNameHeading.value,
            hideExaminedBy: hideExaminedBy.value,
            hideReviewedBy: hideReviewedBy.value,
            hideCreatedBy: hideCreatedBy.value,
            hideFinalizedBy: hideFinalizedBy.value,
            hiddenItemsInPMEReport,
            records,
          },
        };

        if (chosenCustomDropdown.value?.length) {
          payload.items = chosenCustomDropdown.value;
        }

        console.warn('payload', payload);

        const newFormTemplate = await createFormTemplate(payload);
        router.replace({ params: { reportTemplate: newFormTemplate?.id } });
        showSnack({
          message: 'Success!',
          color: 'positive',
        });
        await fakeAwait();
        window.location.reload();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function updateRawTemplate () {
      const elements = document.getElementsByClassName('ape-report-editor-tokens');
      let template = cloneDeep(editorTemplate.value);

      if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          const elem = elements.item(i);
          const elementId = elem.id;
          const stringElem = elem.outerHTML;
          template = template.replace(stringElem, `{${elementId}}`);
        };
      }
      rawTemplate.value = template;
      // config.value = getSummaryReportFields(template, formTemplate.value?.config);
    }

    function onTokenSelect ({ label, value }) {
      const edit = editorRef.value;

      if (value.startsWith('custom_text') || value.startsWith('custom_choices')) {
        edit.runCmd('insertHTML', setChipToToken({ label, value }));
        return;
      }

      const id = `${value}_${nanoid(5)}`;
      if (editorTemplate.value.includes('::')) {
        editorTemplate.value = editorTemplate.value.replace('::', setChipToToken({ label, value: id }));
      } else {
        edit.runCmd('insertHTML', setChipToToken({ label, value: id }));
      }

      edit.focus();
      tokensDialog.value = false;
    }

    async function insertCustomText () {
      if (!await customTextFormRef.value.validate()) return;
      const normalizedLabel = superTrim(customText.value.replace(/[\W_]/g, ' '));
      const label = `Custom Text ${normalizedLabel}`;
      console.warn('normalizedLabel', normalizedLabel);
      const suffix = normalizedLabel.split(' ').join('_').toLowerCase();
      const id = `custom_text_${suffix}_${nanoid(5)}`;
      onTokenSelect({ label, value: id });
      customTextFormRef.value.resetValidation();
      customText.value = '';
      customTextDialog.value = false;
    }

    async function insertCustomDropdown () {
      if (!await customDropdownFormRef.value.validate()) return;
      if (dropdownOptions.value?.some(item => !item.option)) {
        showSnack({
          message: 'Add at least one option',
          color: 'warning',
        });
        return;
      }
      const normalizedLabel = superTrim(dropdownQuestion.value.replace(/[\W_]/g, ' '));
      const label = `Custom Dropdown ${normalizedLabel}`;
      const suffix = normalizedLabel.split(' ').join('_').toLowerCase();
      const id = `custom_choices_${suffix}_${nanoid(5)}`;
      chosenCustomDropdown.value.push({
        type: 'multiplechoice',
        question: id,
        choices: [
          ...dropdownOptions.value.map(item => item.option),
        ],
      });
      onTokenSelect({ label, value: id });
      customDropdownFormRef.value.resetValidation();
      dropdownQuestion.value = '';
      dropdownOptions.value = [{ option: '' }];
      customDropdownDialog.value = false;
    }

    function getTemplateTokens (template) {
      const regex = /(?<=\{)\w+(?=\})/g;
      const tokens = template.match(regex) || [];
      return tokens;
    }

    function setTokenToChip (formTemplate) {
      let template = formTemplate.template || '';
      const tokens = getTemplateTokens(template);

      for (const token of tokens) {
        if (token.startsWith('custom_text') || token.startsWith('custom_choices')) {
          const tokenArr = token.split('_');
          // tokenArr.shift(); // remove 'custom' word in front
          // tokenArr.shift(); // remove 'text' or 'choices' word in front
          tokenArr.pop(); // remove number at the end of the array
          const tokenArrCapitalized = tokenArr.map(capitalized);
          const label = tokenArrCapitalized.join(' ');
          template = template.replace(`{${token}}`, setChipToToken({ label, value: token }));
        } else {
          const tokenArr = token.split('_');
          tokenArr.pop(); // remove number at the end of the array
          const id = tokenArr.join('_');
          const matchedToken = TEMPLATE_TOKENS_MAP.get(id);
          template = template.replace(`{${token}}`, setChipToToken({ label: matchedToken.name, value: token }));
        }
      }

      editorTemplate.value = template;
      return template;
    }

    function setChipToToken ({ label, value }) {
      return `<span class="ape-report-editor-tokens row inline items-center" contenteditable="false" id="${value}">${label}</span>&nbsp;`;
    }

    function addOption () {
      dropdownOptions.value.push({ option: '' });
    }

    function removeOption (index) {
      dropdownOptions.value.splice(index, 1);
    }

    async function onArchive () {
      try {
        const result = await confirm({
          title: 'Archive this report?',
          message: 'Are you sure you want to archive this report?',
        });
        if (!result) return;
        loading.value = true;
        await archiveFormTemplate(formTemplateId);
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onUnarchive () {
      try {
        const result = await confirm({
          title: 'Unarchive this report?',
          message: 'Are you sure you want to unarchive this report?',
        });
        if (!result) return;
        loading.value = true;
        await unarchiveFormTemplate(formTemplateId);
        init();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    async function onDelete () {
      try {
        const result = await confirm({
          title: 'Delete this report?',
          message: 'Are you sure you want to delete this report? This action is irreversible.',
        });
        if (!result) return;
        loading.value = true;
        await removeFormTemplate(formTemplateId);
        goBack();
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    }

    function goBack () {
      router.push({ name: 'pme-report-templates' });
    }

    // New implementation
    function insertMedicalHistoryGroup () {
      const edit = editorRef.value;
      edit.runCmd('insertHTML', `
        <div id="report-template-medical-history-group">
          <div style="height: 200px; display: flex; justify-content: center; align-items: center; border: 1px solid grey;">
            <h3 style="color: grey;">Medical History will show here</h3>
          </div>
        </div>
      `);
    }

    // Custom table
    const customTableDialog = ref(false);
    const customTableFormRef = ref(null);
    const tableRows = ref(null);
    const tableColumns = ref(null);
    async function insertCustomTable () {
      if (!await customTableFormRef.value.validate()) return;
      const tableString = `
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="border: 1px solid #ccc;">
              ${Array.from({ length: tableColumns.value }, () => '<th style="border: 1px solid #ccc; padding: 5px;"></th>').join('')}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: tableRows.value }, () => `
              <tr style="border: 1px solid #ccc;">
                ${Array.from({ length: tableColumns.value }, () => '<td style="border: 1px solid #ccc; padding: 5px;"></td>').join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const parser = new DOMParser();
      const doc = parser.parseFromString(tableString, 'text/html');

      const tableHtml = doc.body;

      setTimeout(() => editorRef.value.runCmd('insertHTML', tableString));

      console.warn('tableString', tableString);
      console.warn('tableHtml', tableHtml);

      customTableFormRef.value.resetValidation();
      customTableDialog.value = false;
    }

    return {
      advancedConfigDialog,
      chosenCustomDropdown,
      config,
      customDropdownDialog,
      customDropdownFormRef,
      customText,
      customTextDialog,
      customTextFormRef,
      description,
      disableClinicHeader,
      disableEditing,
      disablePatientHeader,
      disableTemplateNameHeading,
      dropdownOptions,
      dropdownQuestion,
      editorFontOptions,
      editorRef,
      editorTemplate,
      editorToolbarOptions,
      formTemplate,
      formTemplateAlreadyInUse,
      hideCreatedBy,
      hideExaminedBy,
      hideFinalizedBy,
      hideReviewedBy,
      isArchived,
      isUpdating,
      leftDrawer,
      loading,
      mainFormRef,
      name,
      rawTemplate,
      reportTemplateConfig,
      tokensDialog,
      //
      addOption,
      goBack,
      insertCustomDropdown,
      insertCustomText,
      onArchive,
      onDelete,
      onTokenSelect,
      onUnarchive,
      removeOption,
      submit,
      updateRawTemplate,
      customTableDialog,
      insertCustomTable,
      customTableFormRef,
      tableRows,
      tableColumns,
      insertMedicalHistoryGroup,
    };
  },
};
</script>

<style lang="sass">
.ape-report-editor-tokens
  background: #0099cc
  color: white
  padding: 3px
  &, .q-icon
    border-radius: 3px
  .q-icon
    background: #0099aa
</style>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

table > tr > td {
  border: 1px solid #ccc;
}
</style>
